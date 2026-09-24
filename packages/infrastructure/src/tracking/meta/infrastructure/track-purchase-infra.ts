import type { TrackPurchaseProvider } from "#root/use-cases/tracking/types/purchase";

import { createMetaEventId } from "../create-event-id";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackPurchaseInfra = (): TrackPurchaseProvider => ({
  async track({ checkout, orderId }) {
    const eventId = createMetaEventId("Purchase", orderId);
    const shippingAddress = checkout.shippingAddress;

    await trackMetaEvent({
      eventName: "Purchase",
      eventId,

      customer: {
        email: checkout.email ?? undefined,
        firstName: shippingAddress?.firstName ?? undefined,
        lastName: shippingAddress?.lastName ?? undefined,
        phone: shippingAddress?.phone ?? undefined,
        city: shippingAddress?.city ?? undefined,
        state: shippingAddress?.countryArea ?? undefined,
        postalCode: shippingAddress?.postalCode ?? undefined,
        country: shippingAddress?.country ?? undefined,
      },

      parameters: {
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
    });
  },
});
