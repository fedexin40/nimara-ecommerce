import { metaTrackAddPaymentInfoInfra } from "./infrastructure/track-add-payment-info";
import { metaTrackAddToCartInfra } from "./infrastructure/track-add-to-cart-infra";
import { metaTrackBeginCheckoutInfra } from "./infrastructure/track-begin-checkout-infra";
import { metaTrackPurchaseInfra } from "./infrastructure/track-purchase-infra";
import { metaTrackSearchInfra } from "./infrastructure/track-search-infra";
import { metaTrackSignUpInfra } from "./infrastructure/track-sign-up-infra";
import { metaTrackViewItemInfra } from "./infrastructure/track-view-item-infra";

export const metaTrackingProvider = () => ({
  addToCart: metaTrackAddToCartInfra(),
  viewItem: metaTrackViewItemInfra(),
  purchase: metaTrackPurchaseInfra(),
  search: metaTrackSearchInfra(),
  signUp: metaTrackSignUpInfra(),
  beginCheckout: metaTrackBeginCheckoutInfra(),
  addPaymentInfo: metaTrackAddPaymentInfoInfra(),
});

export type MetaTrackingProvider = ReturnType<
  typeof metaTrackingProvider
>;
