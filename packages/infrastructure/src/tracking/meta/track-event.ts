import { sendMetaCapiEvent } from "./capi-client";
import * as pixel from "./fpixel";
import type { MetaTrackingEvent } from "./types";

/**
 * Sends a Meta event to both:
 * - Meta Pixel (browser)
 * - Meta Conversions API (server)
 *
 * Both transports share the same eventId so Meta can deduplicate them.
 */
export const trackMetaEvent = async ({
  eventName,
  eventId,
  parameters = {},
  eventSourceUrl,
  customer,
}: MetaTrackingEvent): Promise<void> => {
  // Always send the browser event first.
  pixel.event(eventName, parameters, eventId);

  try {
    await sendMetaCapiEvent({
      eventName,
      eventId,
      parameters,
      eventSourceUrl:
        eventSourceUrl ??
        (typeof window !== "undefined"
          ? window.location.href
          : undefined),
      customer,
    });
  } catch (error) {
    /*
     * Tracking failures must never interrupt the storefront flow.
     */
    if (process.env.NODE_ENV !== "production") {
      console.error("Meta CAPI request failed:", error);
    }
  }
};
