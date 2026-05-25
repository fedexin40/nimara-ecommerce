import type { StripeElementLocale } from "@stripe/stripe-js";
import { invariant } from "graphql/jsutils/invariant";

import type {
  ExpressCheckoutElementCreateInfra,
  StripeServiceState,
} from "../../types";

const mapToStripeLocale: Record<string, StripeElementLocale> = {
  "en-US": "en",
};

export const expressCheckoutElementCreateInfra =
  (state: StripeServiceState): ExpressCheckoutElementCreateInfra =>
  async ({
    secret,
    amount,
    currency,
    locale = "auto",
    appearance,
    options,
  }) => {
    invariant(state.clientSDK, "Stripe client not initialized.");

    const mappedLocale = mapToStripeLocale[locale] ?? locale;

    if (secret) {
      state.elements = state.clientSDK.elements({
        clientSecret: secret,
        locale: mappedLocale,
        appearance,
      });
    } else {
      invariant(
        typeof amount === "number" && amount > 0,
        "Amount is required when creating Express Checkout without client secret.",
      );

      invariant(
        currency,
        "Currency is required when creating Express Checkout without client secret.",
      );

      state.elements = state.clientSDK.elements({
        mode: "payment",
        amount,
        currency: currency.toLowerCase(),
        locale: mappedLocale,
        appearance,
      });
    }

    const expressCheckoutElement = state.elements.create(
      "expressCheckout",
      options,
    );

    state.expressCheckoutElement = expressCheckoutElement;

    const mount = (targetElement: HTMLElement) => {
      expressCheckoutElement.mount(targetElement);
    };

    const unmount = () => {
      expressCheckoutElement.unmount();
    };

    const on = expressCheckoutElement.on.bind(expressCheckoutElement);

    return {
      mount,
      unmount,
      on,
    };
  };
