export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type MetaEventParameters = Record<string, unknown>;

const isPixelAvailable = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.fbq === "function";

export const pageview = (): void => {
  if (!isPixelAvailable()) {
    return;
  }

  window.fbq?.("track", "PageView");
};

export const event = (
  eventName: string,
  parameters: MetaEventParameters = {},
): void => {
  if (!isPixelAvailable()) {
    return;
  }

  window.fbq?.("track", eventName, parameters);
};

export const customEvent = (
  eventName: string,
  parameters: MetaEventParameters = {},
): void => {
  if (!isPixelAvailable()) {
    return;
  }

  window.fbq?.("trackCustom", eventName, parameters);
};
