import type { TrackAddToCartProvider } from "#root/use-cases/tracking/types/add-to-cart";

import { createMetaEventId } from "../create-event-id";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackAddToCartInfra =
  (): TrackAddToCartProvider => ({
    async track({ product, price, quantity }) {
      const eventId = createMetaEventId("AddToCart");

      await trackMetaEvent({
        eventName: "AddToCart",
        eventId,
        parameters: createMetaCommerceEvent({
          currency: price.currency,
          value: price.amount * quantity,
          contentName: product.name,
          items: [
            {
              id: product.id,
              quantity,
              item_price: price.amount,
            },
          ],
        }),
      });
    },
  });
