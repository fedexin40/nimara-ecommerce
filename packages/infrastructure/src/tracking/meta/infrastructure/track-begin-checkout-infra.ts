import type { TrackBeginCheckoutProvider } from "#root/use-cases/tracking/types/begin-checkout";

import * as pixel from "../fpixel";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackBeginCheckoutInfra = (): TrackBeginCheckoutProvider => ({
  async track({ checkout }) {
    pixel.event(
      "InitiateCheckout",
      createMetaCommerceEvent({
        currency: checkout.totalPrice.gross.currency,
        value: checkout.totalPrice.gross.amount,

        coupon: checkout.voucherCode || undefined,

        items: checkout.lines.map((line) => ({
          id: line.product.id,
          quantity: line.quantity,
          item_price: line.total.amount / line.quantity,
        })),
      }),
    );
  },
});
