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
    async track({ checkout, user }) {
      const eventId = createMetaEventId("InitiateCheckout");
      const shippingAddress = checkout.shippingAddress;

      await trackMetaEvent({
        eventName: "InitiateCheckout",
        eventId,

        customer: {
          email: user?.email ?? checkout.email ?? undefined,
          firstName:
            user?.firstName ??
            shippingAddress?.firstName ??
            undefined,
          lastName:
            user?.lastName ??
            shippingAddress?.lastName ??
            undefined,
          phone: user?.phone ?? shippingAddress?.phone ?? undefined,
          city: user?.city ?? shippingAddress?.city ?? undefined,
          state: user?.state ?? shippingAddress?.countryArea ?? undefined,
          postalCode: user?.postalCode ?? shippingAddress?.postalCode ?? undefined,
          country: shippingAddress?.country ?? undefined,
        },

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
