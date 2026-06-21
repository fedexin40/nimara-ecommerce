"use server";

import { getLocale } from "next-intl/server";

import { type AppErrorCode } from "@nimara/domain/objects/Error";
import { redirect } from "@nimara/i18n/routing";

import { getCheckoutOrRedirect } from "@/features/checkout/checkout-actions";
import { paths } from "@/foundation/routing/paths";
import { getServiceRegistry } from "@/services/registry";

export type ProcessPaymentResult =
  | { orderId: string }
  | { isProcessing: true }
  | { errors: { code: AppErrorCode }[] };

export const processPaymentAction = async ({
  searchParams,
}: {
  searchParams: Record<string, string>;
}): Promise<ProcessPaymentResult> => {
  const [locale, checkout, services] = await Promise.all([
    getLocale(),
    /**
     * Fetch a fresh checkout on every (re)poll — a cached one would keep
     * reporting the payment as unpaid until the cache TTL expires.
     */
    getCheckoutOrRedirect({ cache: "no-store" }),
    getServiceRegistry(),
  ]);

  const paymentService = await services.getPaymentService();

  const resultPaymentProcess = await paymentService.paymentResultProcess({
    checkout,
    searchParams,
  });

  // 1. In Mexico some payments like oxxo are not pay immediately
  // so instead of failing return to home
  if (!resultPaymentProcess.ok) {
    redirect({
      href: paths.home.asPath(),
      locale,
    });
  }

  // 2. Payment succeeded — create the order.
  if (resultPaymentProcess.data.success) {
    const checkoutService = await services.getCheckoutService();
    const resultOrderCreate = await checkoutService.orderCreate({
      id: checkout.id,
    });

    if (resultOrderCreate.ok) {
      return { orderId: resultOrderCreate.data.orderId };
    }

    return { errors: resultOrderCreate.errors };
  }

  // 3. Payment still processing (requires action / async confirmation) — re-poll.
  return { isProcessing: true };
};
