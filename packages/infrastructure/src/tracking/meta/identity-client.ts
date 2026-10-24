let identityPromise: Promise<string> | undefined;

export const initializeMetaIdentity = (): Promise<string> => {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Meta identity must be initialized in the browser"),
    );
  }

  if (!identityPromise) {
    identityPromise = (async () => {
      const response = await fetch("/api/meta/identity", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Meta identity initialization failed: ${response.status}`,
        );
      }

      const data: unknown = await response.json();

      if (
        typeof data !== "object" ||
        data === null ||
        !("success" in data) ||
        data.success !== true ||
        !("externalId" in data) ||
        typeof data.externalId !== "string" ||
        !data.externalId.trim()
      ) {
        throw new Error("Invalid Meta identity response");
      }

      return data.externalId;
    })().catch((error: unknown) => {
      /*
       * Permite reintentar si la inicialización falla.
       */
      identityPromise = undefined;

      throw error;
    });
  }

  return identityPromise;
};
