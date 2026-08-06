import type { TrackSearchProvider } from "#root/use-cases/tracking/types/search";

import { createMetaEventId } from "../create-event-id";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackSearchInfra = (): TrackSearchProvider => ({
  async track({ searchTerm, resultsCount }) {
    const eventId = createMetaEventId("Search");

    await trackMetaEvent({
      eventName: "Search",
      eventId,
      parameters: {
        search_string: searchTerm,
        ...(resultsCount !== undefined && {
          number_of_results: resultsCount,
        }),
      },
    });
  },
});
