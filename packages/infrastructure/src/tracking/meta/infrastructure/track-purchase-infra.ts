import type { TrackPurchaseProvider } from "#root/use-cases/tracking/types/purchase";

import * as pixel from "../fpixel";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackPurchaseInfra = (): TrackPurchaseProvider => ({
  async track({ checkout, orderId }) {
    pixel.event(
      "Purchase",
      {
        ...createMetaCommerceEvent({
          currency: checkout.totalPrice.gross.currency,
          value: checkout.totalPrice.gross.amount,

          coupon: checkout.voucherCode || undefined,

          items: checkout.lines.map((line) => ({
            id: line.product.id,
            quantity: line.quantity,
            item_price: line.total.amount / line.quantity,
          })),
        }),

        order_id: orderId,

        shipping: checkout.shippingPrice.gross.amount,

        tax: checkout.totalPrice.tax.amount,
      },
    );
  },
});
