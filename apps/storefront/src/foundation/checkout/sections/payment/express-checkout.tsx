"use client";

import { useEffect, useRef, useState } from "react";

import { Spinner } from "@nimara/ui/components/spinner";

import { useCurrentRegion } from "@/foundation/regions";
import { createPaymentServiceLoader } from "@/services/lazy-loaders/payment";
import { storefrontLogger } from "@/services/logging";

const paymentServiceLoader = createPaymentServiceLoader(storefrontLogger);

type ExpressCheckoutProps = {
  amount: number;
  checkoutId: string;
  currency: string;
  isDark?: boolean;
  paymentGatewayCustomer?: string | null;
};

export function ExpressCheckout({
  checkoutId,
  amount,
  currency,
  paymentGatewayCustomer,
  isDark = false,
}: ExpressCheckoutProps) {
  const region = useCurrentRegion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const intentKeyRef = useRef<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stripeAmount = Math.round(amount * 100);

    const intentKey = JSON.stringify({
      checkoutId,
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      customerId: paymentGatewayCustomer ?? null,
      locale: region.language.locale,
      isDark,
    });

    if (intentKeyRef.current === intentKey) {
      return;
    }

    intentKeyRef.current = intentKey;

    let isCancelled = false;
    let unmount: (() => void) | undefined;

    void (async () => {
      try {
        setError(null);
        setIsMounted(false);

        const paymentService = await paymentServiceLoader();

        /**
         * Only initialize Stripe SDK here.
         * Do not create the PaymentIntent yet.
         */
        await paymentService.paymentInitialize();

        if (isCancelled) {
          return;
        }

        if (!containerRef.current) {
          intentKeyRef.current = null;

          return;
        }

        /**
         * Deferred Intent Creation:
         * Express Checkout is rendered with mode/amount/currency.
         * The PaymentIntent will be created later inside `confirm`.
         */
        const expressCheckout =
          await paymentService.expressCheckoutElementCreate({
            locale: region.language.locale,
            amount: stripeAmount,
            currency,
            appearance: {
              theme: isDark ? "night" : "stripe",
              variables: {
                borderRadius: "5px",
              },
            },
            options: {
              emailRequired: true,
              phoneNumberRequired: true,
              shippingAddressRequired: true,
              allowedShippingCountries: ["MX"],
              paymentMethods: {
                googlePay: "always",
                applePay: "always",
                link: "auto",
              },
              layout: {
                maxColumns: 1,
                maxRows: 3,
                overflow: "auto",
              },
            },
          });

        if (isCancelled) {
          return;
        }

        expressCheckout.on("ready", () => {
          setIsMounted(true);
        });

        expressCheckout.on("loaderror", (event) => {
          console.error("Express Checkout load error:", event);
          setError("No se pudieron cargar los botones de pago express.");
          intentKeyRef.current = null;
        });

        expressCheckout.on("confirm", async (event) => {
          const transaction =
            await paymentService.paymentGatewayTransactionInitialize({
              id: checkoutId,
              amount,
              customerId: paymentGatewayCustomer,
              saveForFutureUse: false,
            });

          if (!transaction.ok) {
            event.paymentFailed({
              reason: "fail",
            });

            return;
          }

          const result = await paymentService.paymentExecute({
            billingDetails: {},
            paymentSecret: transaction.data.clientSecret,
            redirectUrl: `${window.location.origin}/checkout/payment/confirmation`,
          });

          if (!result.ok) {
            event.paymentFailed({
              reason: "fail",
            });
          }
        });

        expressCheckout.mount(containerRef.current);

        unmount = expressCheckout.unmount;
      } catch (error) {
        console.error(error);
        setError("Ocurrió un error inicializando Express Checkout.");
        intentKeyRef.current = null;
      }
    })();

    return () => {
      isCancelled = true;
      unmount?.();
    };
  }, [
    checkoutId,
    amount,
    currency,
    paymentGatewayCustomer,
    region.language.locale,
    isDark,
  ]);

  return (
    <div className="space-y-4">
      {!isMounted && !error && (
        <div className="space-y-3">
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        </div>
      )}

      <div ref={containerRef} />

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
