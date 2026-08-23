"use client";

import { useEffect, useRef, useState } from "react";

import { type Checkout } from "@nimara/domain/objects/Checkout";
import { type AppErrorCode } from "@nimara/domain/objects/Error";
import { useRouter } from "@nimara/i18n/routing";

import { AppErrorMessage } from "@/foundation/errors/components/app-error-message";
import { paths, QUERY_PARAMS } from "@/foundation/routing/paths";
import { createTrackingServiceLoader } from "@/services/lazy-loaders/tracking";

import { processPaymentAction, type ProcessPaymentResult } from "../actions";

const trackingServiceLoader = createTrackingServiceLoader();

const POLL_DELAY_MS = 750;

export const ProcessingInfo = ({
  checkout,
  searchParams,
}: {
  checkout: Checkout;
  searchParams: Record<string, string>;
}) => {
  const router = useRouter();
  const [errors, setErrors] = useState<{ code: AppErrorCode }[]>([]);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const tick = async () => {
      const result: ProcessPaymentResult = await processPaymentAction({
        searchParams,
      });

      if (isCancelled) {
        return;
      }

      if ("orderId" in result) {
        const { trackPurchase } = await trackingServiceLoader();

        await trackPurchase({ checkout, orderId: result.orderId });

        router.replace(
          paths.order.confirmation.asPath({
            id: result.orderId,
            query: { [QUERY_PARAMS.orderPlaced]: "true" },
          }),
        );

        return;
      }

      if ("isProcessing" in result) {
        pollRef.current = setTimeout(tick, POLL_DELAY_MS);

        return;
      }

      setErrors(result.errors);
    };

    void tick();

    return () => {
      isCancelled = true;

      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  return (
    <div className="py-32 leading-10">
      {errors.length ? (
        errors.map(({ code }, i) => (
          <p key={i}>
            <AppErrorMessage code={code} />
          </p>
        ))
      ) : (
        <>
          <div className="grid gap-8 font-normal">
            <h2 className="text-2xl font-normal">
              Muchas gracias por tu preferencia
            </h2>
            <p className="text-left text-gray-500 dark:text-muted-foreground md:text-center">
              Una vez que recibamos el pago le enviaremos una notificación. Si
              ya realizó el pago, por favor espere unos momentos mientras
              procesamos su pago o actualice la página.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
