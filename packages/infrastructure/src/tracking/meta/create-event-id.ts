export const createMetaEventId = (
  eventName: string,
  stableId?: string,
): string => {
  if (stableId) {
    return `${eventName}_${stableId}`;
  }

  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${eventName}_${globalThis.crypto.randomUUID()}`;
  }

  return `${eventName}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
};
