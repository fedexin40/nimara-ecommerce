import type { TrackSearchProvider } from "#root/use-cases/tracking/types/search";

import * as pixel from "../fpixel";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackSearchInfra = (): TrackSearchProvider => ({
  async track({ searchTerm, resultsCount }) {
    pixel.event("Search", {
      search_string: searchTerm,
      ...(resultsCount !== undefined && {
        number_of_results: resultsCount,
      }),
    });
  },
});
