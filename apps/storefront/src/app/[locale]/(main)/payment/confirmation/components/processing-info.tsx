"use client";

import { useTranslations } from "next-intl";
import { useInterval } from "usehooks-ts";

import { type AppErrorCode } from "@nimara/domain/objects/Error";
import { useRouter } from "@nimara/i18n/routing";

export const ProcessingInfo = ({
  errors,
}: {
  errors: { code: AppErrorCode }[];
}) => {
  const t = useTranslations();
  const router = useRouter();

  useInterval(() => {
    router.refresh();
  }, 3500);

  return (
    <div className="py-10 leading-10">
      {errors.length ? (
        errors.map(({ code }, i) => <p key={i}>{t(`errors.${code}`)}</p>)
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
