import type { TrackSignUpProvider } from "#root/use-cases/tracking/types/sign-up";

import { createMetaEventId } from "../create-event-id";
import { trackMetaEvent } from "../track-event";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackSignUpInfra = (): TrackSignUpProvider => ({
  async track({ method }) {
    const eventId = createMetaEventId("CompleteRegistration");

    await trackMetaEvent({
      eventName: "CompleteRegistration",
      eventId,
      parameters: {
        ...(method && {
          registration_method: method,
        }),
      },
    });
  },
});
