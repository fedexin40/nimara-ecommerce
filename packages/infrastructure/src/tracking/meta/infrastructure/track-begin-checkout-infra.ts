import type { TrackBeginCheckoutProvider } from "#root/use-cases/tracking/types/begin-checkout";

import { createMetaEventId } from "../create-event-id";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackBeginCheckoutInfra =
  (): TrackBeginCheckoutProvider => ({
    async track({ checkout }) {
      const eventId = createMetaEventId("InitiateCheckout");

      await trackMetaEvent({
        eventName: "InitiateCheckout",
        eventId,
        parameters: createMetaCommerceEvent({
          currency: checkout.totalPrice.gross.currency,
          value: checkout.totalPrice.gross.amount,

          coupon: checkout.voucherCode || undefined,

          items: checkout.lines.map((line) => ({
            id: line.product.id,
            quantity: line.quantity,
            item_price: line.total.amount / line.quantity,
          })),
        }),
      });
    },
  });
