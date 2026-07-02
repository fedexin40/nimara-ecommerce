"use client";

import { useEffect, useRef, useState } from "react";

import type { Checkout } from "@nimara/domain/objects/Checkout";

import { useCurrentRegion } from "@/foundation/regions";
import { paths } from "@/foundation/routing/paths";
import { createPaymentServiceLoader } from "@/services/lazy-loaders/payment";
import { storefrontLogger } from "@/services/logging";

const paymentServiceLoader = createPaymentServiceLoader(storefrontLogger);

type ConfirmShippingResult = {
  billingAddress: Checkout["billingAddress"];
  ok: boolean;
};

type ExpressCheckoutConfirmEvent = {
  billingDetails?: {
    email?: string | null;
    phone?: string | null;
  };
  paymentFailed: (payload: { reason: "fail" }) => void;
  shippingAddress?: {
    address?: {
      city?: string | null;
      country?: string | null;
      line1?: string | null;
      line2?: string | null;
      postal_code?: string | null;
      state?: string | null;
    };
    name?: string | null;
  };
  shippingRate?: {
    amount?: number;
    displayName?: string;
    id?: string;
  };
};

type ExpressCheckoutProps = {
  amount: number;
  checkoutId: string;
  currency: string;
  isDark?: boolean;
  paymentGatewayCustomer?: string | null;
  storeUrl: string | undefined;
};

type SkydropxShippingMethod = {
  days: number;
  id: string;
  provider_display_name: string;
  provider_service_name: string;
  total: number;
};

type SkydropxShippingMethodsResponse = {
  quotation_id: string;
  shipping_methods: SkydropxShippingMethod[];
};

type PaymentTransaction = {
  data: {
    clientSecret: string;
  };
  ok: boolean;
};

export function stripeExpressCheckoutToShippingAddressInput(
  event: ExpressCheckoutConfirmEvent,
) {
  const shippingAddress = event.shippingAddress;
  const address = shippingAddress?.address;

  const fullName = shippingAddress?.name ?? "";
  const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
    companyName: "",
    streetAddress1: address?.line1 ?? "",
    streetAddress2: address?.line2 ?? "",
    city: address?.city ?? "",
    cityArea: address?.line2 ?? "",
    countryArea: address?.state ?? "",
    postalCode: address?.postal_code ?? "",
    country: address?.country ?? "",
    phone: event.billingDetails?.phone ?? "",
    saveForFutureUse: false,
  };
}

function getPaymentIntentIdFromClientSecret(clientSecret: string) {
  return clientSecret.split("_secret_")[0];
}

export function ExpressCheckout({
  checkoutId,
  amount,
  currency,
  paymentGatewayCustomer,
  isDark = false,
  storeUrl,
}: ExpressCheckoutProps) {
  const region = useCurrentRegion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intentKeyRef = useRef<string | null>(null);
  const quotationIdRef = useRef<string | null>(null);
  const defaultShippingRateIdRef = useRef<string | null>(null);

  const paymentIntentPromiseRef = useRef<Promise<PaymentTransaction> | null>(
    null,
  );

  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stripeAmount = Math.round(amount * 100);

    const intentKey = JSON.stringify({
      checkoutId,
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      customerId: paymentGatewayCustomer ?? null,
      locale: region.language.locale,
    });

    if (intentKeyRef.current === intentKey) {
      return;
    }

    intentKeyRef.current = intentKey;

    let isCancelled = false;
    let unmount: (() => void) | undefined;

    const readyTimeout: number | undefined = window.setTimeout(() => {
      if (!isCancelled) {
        setError(null);
        setIsMounted(true);
        intentKeyRef.current = null;
      }
    }, 5000);

    void (async () => {
      try {
        setError(null);
        setIsMounted(false);
        paymentIntentPromiseRef.current = null;
        quotationIdRef.current = null;
        defaultShippingRateIdRef.current = null;

        const paymentService = await paymentServiceLoader();

        const [gatewayInitializeResult] = await Promise.all([
          paymentService.paymentGatewayInitialize({
            id: checkoutId,
            amount,
          }),
          paymentService.paymentInitialize(),
        ]);

        if (!gatewayInitializeResult.ok) {
          setError(null);
          setIsMounted(true);
          intentKeyRef.current = null;

          return;
        }

        if (isCancelled || !containerRef.current) {
          intentKeyRef.current = null;

          return;
        }

        const expressCheckout =
          await paymentService.expressCheckoutElementCreate({
            locale: region.language.locale,
            amount: stripeAmount,
            currency,
            appearance: {
              theme: isDark ? "night" : "stripe",
              variables: {
                borderRadius: "5px",
              },
            },
            options: {
              emailRequired: true,
              phoneNumberRequired: true,
              shippingAddressRequired: true,
              allowedShippingCountries: ["MX"],
              paymentMethods: {
                googlePay: "always",
                applePay: "always",
                link: "auto",
              },
              layout: {
                maxColumns: 1,
                maxRows: 3,
                overflow: "auto",
              },
            },
          });

        if (isCancelled) {
          return;
        }

        expressCheckout.on("ready", () => {
          if (readyTimeout !== undefined) {
            window.clearTimeout(readyTimeout);
          }

          setIsMounted(true);
        });

        expressCheckout.on("loaderror", (event) => {
          if (readyTimeout !== undefined) {
            window.clearTimeout(readyTimeout);
          }

          console.error("Express Checkout load error:", event);

          setError(null);
          setIsMounted(true);

          intentKeyRef.current = null;
        });

        expressCheckout.on("click", (event) => {
          paymentIntentPromiseRef.current =
            paymentService.paymentGatewayTransactionInitialize({
              id: checkoutId,
              amount,
              customerId: paymentGatewayCustomer,
              saveForFutureUse: false,
            }) as Promise<PaymentTransaction>;

          expressCheckout.update({
            amount: stripeAmount,
          });

          event.resolve({
            lineItems: [
              {
                name: "Subtotal",
                amount: stripeAmount,
              },
            ],
          });
        });

        expressCheckout.on("cancel", () => {
          paymentIntentPromiseRef.current = null;
          quotationIdRef.current = null;
          defaultShippingRateIdRef.current = null;

          expressCheckout.update({
            amount: stripeAmount,
          });
        });

        expressCheckout.on("shippingaddresschange", async (event) => {
          try {
            const shippingMethodsResponse = (await fetch(
              "/api/checkout/shipping-methods",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount: amount,
                  checkoutId: checkoutId,
                  address: {
                    country_code: event.address.country?.toLowerCase(),
                    postal_code: event.address.postal_code,
                    area_level1: event.address.state,
                    area_level2: event.address.city,
                  },
                }),
              },
            ).then((res) => res.json())) as SkydropxShippingMethodsResponse;

            const shippingMethods = shippingMethodsResponse.shipping_methods;

            if (!shippingMethods.length) {
              event.reject();

              return;
            }

            quotationIdRef.current = shippingMethodsResponse.quotation_id;

            const shippingRates = shippingMethods.map((method) => ({
              id: method.id,
              displayName:
                method.provider_display_name +
                " " +
                method.provider_service_name,
              amount: Math.round(method.total * 100),
              deliveryEstimate: {
                minimum: {
                  unit: "business_day" as const,
                  value: 1,
                },
                maximum: {
                  unit: "business_day" as const,
                  value: method.days,
                },
              },
            }));

            const defaultShippingRate = shippingRates[0];

            defaultShippingRateIdRef.current = defaultShippingRate.id;

            const defaultShippingAmount = defaultShippingRate.amount;
            const totalAmount = stripeAmount + defaultShippingAmount;

            const transaction = await paymentIntentPromiseRef.current;

            if (!transaction?.ok) {
              event.reject();

              return;
            }

            const paymentIntentId = getPaymentIntentIdFromClientSecret(
              transaction.data.clientSecret,
            );

            const response = await fetch(
              "/api/checkout/update-payment-intent",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentIntentId,
                  amount: totalAmount,
                }),
              },
            );

            if (!response.ok) {
              event.reject();

              return;
            }

            expressCheckout.update({
              amount: totalAmount,
            });

            event.resolve({
              lineItems: [
                {
                  name: "Subtotal",
                  amount: stripeAmount,
                },
                {
                  name: "Envío",
                  amount: defaultShippingAmount,
                },
              ],
              shippingRates,
            });
          } catch (error) {
            console.error("Shipping address change error:", error);
            event.reject();
          }
        });

        expressCheckout.on("shippingratechange", async (event) => {
          try {
            const shippingAmount = event.shippingRate.amount;
            const totalAmount = stripeAmount + shippingAmount;

            const transaction = await paymentIntentPromiseRef.current;

            if (!transaction?.ok) {
              event.reject();

              return;
            }

            const paymentIntentId = getPaymentIntentIdFromClientSecret(
              transaction.data.clientSecret,
            );

            const response = await fetch(
              "/api/checkout/update-payment-intent",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentIntentId,
                  amount: totalAmount,
                }),
              },
            );

            if (!response.ok) {
              event.reject();

              return;
            }

            expressCheckout.update({
              amount: totalAmount,
            });

            event.resolve({
              lineItems: [
                {
                  name: "Subtotal",
                  amount: stripeAmount,
                },
                {
                  name: "Envío",
                  amount: shippingAmount,
                },
              ],
            });
          } catch (error) {
            console.error("Shipping rate change error:", error);
            event.reject();
          }
        });

        expressCheckout.on("confirm", async (event) => {
          try {
            const shippingAddressInput =
              stripeExpressCheckoutToShippingAddressInput(event);

            const shippingRate = event.shippingRate;
            const shippingMethodName = shippingRate?.displayName;
            const shippingMethodPrice = shippingRate?.amount;
            const email = event.billingDetails?.email;

            const confirmShippingResponse = await fetch(
              "/api/checkout/confirm-checkout-express",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  checkoutId,
                  shippingAddressInput,
                  shippingMethodName,
                  shippingMethodPrice,
                  email,
                }),
              },
            );

            const confirmShippingResult =
              (await confirmShippingResponse.json()) as ConfirmShippingResult;

            if (!confirmShippingResponse.ok) {
              event.paymentFailed({ reason: "fail" });

              return;
            }

            const transaction = await paymentIntentPromiseRef.current;

            if (!transaction?.ok) {
              event.paymentFailed({ reason: "fail" });

              return;
            }

            const redirectUrl = `${storeUrl}${paths.payment.confirmation.asPath()}`;
            const result = await paymentService.paymentExecute({
              billingDetails: confirmShippingResult.billingAddress ?? {},
              paymentSecret: transaction.data.clientSecret,
              redirectUrl: redirectUrl,
            });

            if (!result.ok) {
              event.paymentFailed({ reason: "fail" });
            }
          } catch (error) {
            console.error("Express Checkout confirm error:", error);
            event.paymentFailed({ reason: "fail" });
          }
        });

        expressCheckout.mount(containerRef.current);

        unmount = expressCheckout.unmount;
      } catch (error) {
        if (readyTimeout !== undefined) {
          window.clearTimeout(readyTimeout);
        }

        console.error(error);

        setError(null);
        setIsMounted(true);

        intentKeyRef.current = null;
      }
    })();

    return () => {
      isCancelled = true;
      paymentIntentPromiseRef.current = null;
      quotationIdRef.current = null;
      defaultShippingRateIdRef.current = null;
      intentKeyRef.current = null;

      if (readyTimeout !== undefined) {
        window.clearTimeout(readyTimeout);
      }

      unmount?.();
    };
  }, [checkoutId, amount, currency]);

  return (
    <div className="space-y-4">
      {!isMounted && !error && (
        <div className="space-y-3">
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        </div>
      )}

      <div ref={containerRef} />

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
