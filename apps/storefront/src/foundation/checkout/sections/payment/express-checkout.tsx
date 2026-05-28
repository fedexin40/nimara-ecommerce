"use client";

import { useEffect, useRef, useState } from "react";

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

type SkydropxShippingMethod = {
  days: number;
  id: string;
  provider_name: string;
  total: number;
};

type PaymentTransaction = {
  data: {
    clientSecret: string;
  };
  ok: boolean;
};

function getPaymentIntentIdFromClientSecret(clientSecret: string) {
  return clientSecret.split("_secret_")[0];
}

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

        const paymentIntentPromise =
          paymentService.paymentGatewayTransactionInitialize({
            id: checkoutId,
            amount,
            customerId: paymentGatewayCustomer,
            saveForFutureUse: false,
          }) as Promise<PaymentTransaction>;

        await paymentService.paymentInitialize();

        if (isCancelled || !containerRef.current) {
          intentKeyRef.current = null;

          return;
        }

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

        expressCheckout.on("shippingaddresschange", async (event) => {
          try {
            const shippingMethods = (await fetch(
              "/api/checkout/shipping-methods",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  address: {
                    country_code: event.address.country?.toLowerCase(),
                    postal_code: event.address.postal_code,
                    area_level1: event.address.state,
                    area_level2: event.address.city,
                  },
                }),
              },
            ).then((res) => res.json())) as SkydropxShippingMethod[];

            event.resolve({
              lineItems: [
                {
                  name: "Subtotal",
                  amount: stripeAmount,
                },
              ],
              shippingRates: shippingMethods.map((method) => ({
                id: method.id,
                displayName: method.provider_name,
                amount: Math.round(method.total * 100),
                deliveryEstimate: {
                  minimum: {
                    unit: "business_day",
                    value: 1,
                  },
                  maximum: {
                    unit: "business_day",
                    value: method.days,
                  },
                },
              })),
            });
          } catch (error) {
            console.error("Shipping address change error:", error);
            event.reject();
          }
        });

        expressCheckout.on("shippingratechange", async (event) => {
          try {
            const shippingAmount = event.shippingRate.amount;
            const totalAmount = stripeAmount + shippingAmount;

            const transaction = await paymentIntentPromise;

            if (!transaction.ok) {
              event.reject();

              return;
            }

            const paymentIntentId = getPaymentIntentIdFromClientSecret(
              transaction.data.clientSecret,
            );

            const response = await fetch(
              "/api/checkout/update-payment-intent",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentIntentId,
                  amount: totalAmount,
                }),
              },
            );

            if (!response.ok) {
              event.reject();

              return;
            }

            expressCheckout.update({
              amount: totalAmount,
            });

            event.resolve({
              lineItems: [
                {
                  name: "Subtotal",
                  amount: stripeAmount,
                },
                {
                  name: "Envío",
                  amount: shippingAmount,
                },
              ],
            });
          } catch (error) {
            console.error("Shipping rate change error:", error);
            event.reject();
          }
        });

        expressCheckout.on("confirm", async (event) => {
          try {
            const transaction = await paymentIntentPromise;

            if (!transaction.ok) {
              event.paymentFailed({ reason: "fail" });

              return;
            }

            const result = await paymentService.paymentExecute({
              billingDetails: {},
              paymentSecret: transaction.data.clientSecret,
              redirectUrl: `${window.location.origin}/checkout/payment/confirmation`,
            });

            if (!result.ok) {
              event.paymentFailed({ reason: "fail" });
            }
          } catch (error) {
            console.error("Express Checkout confirm error:", error);
            event.paymentFailed({ reason: "fail" });
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
