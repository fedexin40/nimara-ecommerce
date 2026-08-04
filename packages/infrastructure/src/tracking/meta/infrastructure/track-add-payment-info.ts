import type { TrackAddPaymentInfoProvider } from "#root/use-cases/tracking/types/add-payment-info";

import * as pixel from "../fpixel";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackAddPaymentInfoInfra =
  (): TrackAddPaymentInfoProvider => ({
    async track({ checkout, paymentType }) {
      pixel.event(
        "AddPaymentInfo",
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

          ...(paymentType
            ? {
                payment_type: paymentType,
              }
            : {}),
        },
      );
    },
  });
