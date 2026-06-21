"use client";

import { useEffect } from "react";

import { paths } from "@/foundation/routing/paths";

export default function CheckoutClearedPage() {
  console.log(paths.home.asPath());
  useEffect(() => {
    window.location.href = paths.home.asPath();
  }, []);

  return <p>Redirecting...</p>;
}
