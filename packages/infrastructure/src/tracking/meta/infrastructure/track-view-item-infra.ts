import type { TrackViewItemProvider } from "#root/use-cases/tracking/types/view-item";

import { createMetaEventId } from "../create-event-id";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackViewItemInfra = (): TrackViewItemProvider => ({
  async track({ product, price }) {
    const eventId = createMetaEventId("ViewContent");

    await trackMetaEvent({
      eventName: "ViewContent",
      eventId,
      parameters: createMetaCommerceEvent({
        currency: price.currency,
        value: price.amount,

        contentName: product.name,

        items: [
          {
            id: product.id,
            quantity: 1,
            item_price: price.amount,
          },
        ],
      }),
    });
  },
});
