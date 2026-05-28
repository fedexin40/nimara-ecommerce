import type {
  ExpressCheckoutElementCreateInfra,
  ExpressCheckoutElementCreateUseCase,
} from "../../payment/types.ts";

export const createExpressCheckoutElementUseCase =
  ({
    expressCheckoutElementCreate,
  }: {
    expressCheckoutElementCreate: ExpressCheckoutElementCreateInfra;
  }): ExpressCheckoutElementCreateUseCase =>
  async ({ locale, secret, amount, currency, appearance, options }) => {
    const { mount, unmount, on, update } = await expressCheckoutElementCreate({
      locale,
      secret,
      amount,
      currency,
      appearance,
      options,
    });

    return {
      mount,
      unmount,
      on,
      update
    };
  };
