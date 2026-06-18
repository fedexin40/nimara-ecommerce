import { invariant } from "graphql/jsutils/invariant";

import { err, ok } from "@nimara/domain/objects/Result";

import { logger } from "#root/logging/service";
import { handleStripeErrors } from "#root/payment/helpers";

import { PAYMENT_REDIRECT, QUERY_PARAMS } from "../../consts";
import type { PaymentExecuteInfra, StripeServiceState } from "../../types";

export const paymentExecuteInfra =
  (serviceState: StripeServiceState): PaymentExecuteInfra =>
  async ({
    paymentSecret,
    redirectUrl,
    billingDetails: {
      streetAddress1,
      streetAddress2,
      state,
      email,
      name,
      country,
      postalCode,
    },
  }) => {
    invariant(serviceState.clientSDK, "Client not initiated.");

    const isUsingNewPaymentMethod = !paymentSecret;

    if (isUsingNewPaymentMethod) {
      invariant(
        serviceState.paymentElement && serviceState.elements,
        "Payment elements must be initiated when using new payment method.",
      );
      serviceState.paymentElement.update({ readOnly: true });
    }

    const returnUrl = new URL(redirectUrl);

    if (serviceState.transactionId) {
      returnUrl.searchParams.append(
        QUERY_PARAMS.TRANSACTION_ID,
        serviceState.transactionId,
      );
    }

    const confirmPaymentParams = paymentSecret
  ? {
      clientSecret: paymentSecret,
      elements: serviceState.elements,
    }
  : {
      elements: serviceState.elements,
    };
    const { error } = await serviceState.clientSDK.confirmPayment({
      // @ts-expect-error Stripe types do not correctly infer the overload
      redirect: PAYMENT_REDIRECT,
      confirmParams: {
        return_url: returnUrl.toString(),
        payment_method_data: {
          billing_details: {
            email,
            name,
            address: {
              state,
              country,
              line2: streetAddress2,
              line1: streetAddress1,
              postal_code: postalCode,
            },
          },
        },
      },
      ...confirmPaymentParams,
    });

    if (isUsingNewPaymentMethod) {
      serviceState.paymentElement!.update({ readOnly: false });
    }

    if (error) {
      logger.error("Payment execution failed.", {
        transactionId: serviceState.transactionId ?? null,
        paymentSecret,
        redirectUrl,
        originalError: {
          code: error.code,
          message: error.message,
          type: error.type,
        },
      });

      return err(handleStripeErrors(error));
    }

    return ok({ success: true });
  };
