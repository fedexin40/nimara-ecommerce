import type { MetaTrackingEvent } from "./types";

export const sendMetaCapiEvent = async (
  event: MetaTrackingEvent,
): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch("/api/meta/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify(event),
    });

    if (!response.ok && process.env.NODE_ENV !== "production") {
      console.error(
        "Meta CAPI request failed:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    /*
     * Tracking must never interrupt the storefront flow.
     */
    if (process.env.NODE_ENV !== "production") {
      console.error("Meta CAPI request failed:", error);
    }
  }
};
