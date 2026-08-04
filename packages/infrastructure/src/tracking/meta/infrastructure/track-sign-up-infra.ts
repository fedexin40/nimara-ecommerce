import type { TrackSignUpProvider } from "#root/use-cases/tracking/types/sign-up";

import * as pixel from "../fpixel";

/**
 * Reference:
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 */
export const metaTrackSignUpInfra = (): TrackSignUpProvider => ({
  async track({ method }) {
    pixel.event("CompleteRegistration", {
      ...(method && {
        registration_method: method,
      }),
    });
  },
});
