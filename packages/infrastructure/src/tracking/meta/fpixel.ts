import { initializeMetaIdentity } from "./identity-client";
import type {
  MetaEventParameters,
  MetaStandardEventName,
} from "./types";

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

const isDevelopment = process.env.NODE_ENV !== "production";

const isBrowser = (): boolean =>
  typeof window !== "undefined";

const isPixelAvailable = (): boolean =>
  isBrowser() && typeof window.fbq === "function";

let pixelInitialized = false;

const logUnavailablePixel = (
  eventName: string,
  eventId?: string,
): void => {
  if (!isDevelopment) {
    return;
  }

  if (!isBrowser()) {
    console.warn("[Meta Pixel] Event executed outside the browser", {
      eventName,
      eventId,
    });

    return;
  }

  console.warn("[Meta Pixel] fbq is not initialized", {
    eventName,
    eventId,
  });
};

const initializeMetaPixel = async (): Promise<void> => {
  const externalId = await initializeMetaIdentity();

  if (pixelInitialized) {
    return;
  }

  if (!isPixelAvailable()) {
    throw new Error("Meta Pixel is not available");
  }

  if (!FB_PIXEL_ID) {
    throw new Error("Meta Pixel ID is not configured");
  }

  window.fbq?.(
    "init",
    FB_PIXEL_ID,
    {
      external_id: externalId,
    },
  );

  pixelInitialized = true;
};

const track = async (
  method: "track" | "trackCustom",
  eventName: string,
  parameters: MetaEventParameters = {},
  eventId?: string,
): Promise<void> => {
  if (!isBrowser()) {
    logUnavailablePixel(eventName, eventId);
    return;
  }

  try {
    await initializeMetaPixel();

    if (isDevelopment) {
      console.debug("[Meta Pixel] Sending browser event", {
        method,
        eventName,
        eventId,
        parameters,
      });
    }

    if (eventId) {
      window.fbq?.(
        method,
        eventName,
        parameters,
        {
          eventID: eventId,
        },
      );

      return;
    }

    window.fbq?.(
      method,
      eventName,
      parameters,
    );
  } catch (error) {
    /*
     * Tracking must never interrupt the storefront flow.
     */
    if (isDevelopment) {
      console.error("[Meta Pixel] Event could not be sent", {
        eventName,
        eventId,
        error,
      });
    }
  }
};

export const pageview = (eventId?: string): void => {
  void track(
    "track",
    "PageView",
    {},
    eventId,
  );
};

export const event = (
  eventName: MetaStandardEventName,
  parameters: MetaEventParameters = {},
  eventId?: string,
): void => {
  void track(
    "track",
    eventName,
    parameters,
    eventId,
  );
};

export const customEvent = (
  eventName: string,
  parameters: MetaEventParameters = {},
  eventId?: string,
): void => {
  void track(
    "trackCustom",
    eventName,
    parameters,
    eventId,
  );
};
