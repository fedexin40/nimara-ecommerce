"use client";

import { useEffect } from "react";

export const CheckoutTracking = () => {
  useEffect(() => {
    void fetch("/api/meta/tracking", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
    }).catch((error) => {
      console.error("Checkout tracking failed:", error);
    });
  }, []);

  return null;
};
