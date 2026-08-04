import type { TrackAddToCartProvider } from "#root/use-cases/tracking/types/add-to-cart";

import * as pixel from "../fpixel";
import { createMetaCommerceEvent } from "../helpers/create-commerce-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackAddToCartInfra = (): TrackAddToCartProvider => ({
  async track({ product, price, quantity }) {
    pixel.event(
      "AddToCart",
      createMetaCommerceEvent({
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
    );
  },
});
