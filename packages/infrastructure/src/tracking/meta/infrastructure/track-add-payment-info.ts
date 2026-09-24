import type { TrackAddPaymentInfoProvider } from "#root/use-cases/tracking/types/add-payment-info";

import { createMetaEventId } from "../create-event-id";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackAddPaymentInfoInfra =
  (): TrackAddPaymentInfoProvider => ({
    async track({ checkout, paymentType }) {
      const eventId = createMetaEventId("AddPaymentInfo");
      const shippingAddress = checkout.shippingAddress;

      await trackMetaEvent({
        eventName: "AddPaymentInfo",
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

          ...(paymentType
            ? {
                payment_type: paymentType,
              }
            : {}),
        },
      });
    },
  });
