import type { TrackViewItemProvider } from "#root/use-cases/tracking/types/view-item";

import * as pixel from "../fpixel";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackViewItemInfra = (): TrackViewItemProvider => ({
  async track({ product, price }) {
    pixel.event(
      "ViewContent",
      createMetaCommerceEvent({
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
    );
  },
});
