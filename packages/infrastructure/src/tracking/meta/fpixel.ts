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

const track = (
  method: "track" | "trackCustom",
  eventName: string,
  parameters: MetaEventParameters = {},
  eventId?: string,
): void => {
  if (!isPixelAvailable()) {
    logUnavailablePixel(eventName, eventId);
    return;
  }

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
};

export const pageview = (eventId?: string): void => {
  track(
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
  track(
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
  track(
    "trackCustom",
    eventName,
    parameters,
    eventId,
  );
};
