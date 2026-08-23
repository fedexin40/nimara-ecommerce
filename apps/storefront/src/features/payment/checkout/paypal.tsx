"use client";

import {
  type OnApproveDataOneTimePayments,
  type OnCancelDataOneTimePayments,
  type OnErrorData,
  PayPalOneTimePaymentButton,
  PayPalProvider,
} from "@paypal/react-paypal-js/sdk-v6";
import { useState } from "react";

import { type Checkout } from "@nimara/domain/objects/Checkout";
import { useRouter } from "@nimara/i18n/routing";

import { paths } from "@/foundation/routing/paths";

type PayPalPaymentProps = {
  checkout: Checkout;
  onUpdateBillingAddress: () => Promise<void>;
};

type CreatePayPalOrderResponse = {
  error?: string;
  errorCode?: string;
  paypalOrderId?: string;
};

type CapturePayPalOrderResponse = {
  captureId?: string;
  error?: string;
  errorCode?: string;
  status?: "COMPLETED" | "PENDING" | "FAILED";
};

const PAYPAL_ENVIRONMENT =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";

const getPayPalUserErrorMessage = (
  errorCode?: string,
  fallback?: string,
): string => {
  switch (errorCode) {
    case "INSTRUMENT_DECLINED":
      return "Tu tarjeta o método de pago fue rechazado. Intenta con otra tarjeta u otro método de pago.";

    case "PAYER_ACTION_REQUIRED":
      return "PayPal requiere una verificación adicional. Abre PayPal y completa la acción solicitada.";

    case "CARD_EXPIRED":
      return "La tarjeta ha expirado. Usa otra tarjeta o actualiza tu método de pago en PayPal.";

    case "TRANSACTION_REFUSED":
      return "La transacción fue rechazada por el banco emisor. Intenta con otro método de pago.";

    case "RISK_DECLINE":
      return "PayPal rechazó el pago por motivos de seguridad. Intenta con otro método de pago.";

    case "DUPLICATE_TRANSACTION":
      return "Parece que ya existe un pago similar reciente. Verifica tu cuenta antes de volver a intentar.";

    case "ORDER_ALREADY_CAPTURED":
      return "Este pago ya fue procesado. Actualiza la página o revisa tu confirmación de compra.";

    case "ORDER_NOT_APPROVED":
      return "El pago no fue aprobado en PayPal. Intenta nuevamente.";

    default:
      return (
        fallback ??
        "No fue posible completar el pago con PayPal. Intenta nuevamente."
      );
  }
};

export function PayPalPayment({
  checkout,
  onUpdateBillingAddress,
}: PayPalPaymentProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="text-sm font-medium text-destructive">
        Missing PayPal client ID.
      </p>
    );
  }

  return (
    <PayPalProvider
      clientId={clientId}
      components={["paypal-payments"]}
      environment={PAYPAL_ENVIRONMENT}
      pageType="checkout"
    >
      <PayPalPaymentButton
        checkout={checkout}
        onUpdateBillingAddress={onUpdateBillingAddress}
      />
    </PayPalProvider>
  );
}

function PayPalPaymentButton({
  checkout,
  onUpdateBillingAddress,
}: PayPalPaymentProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createOrder = async (): Promise<{ orderId: string }> => {
    setErrorMessage(null);

    try {
      await onUpdateBillingAddress();

      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkoutId: checkout.id,
          amount: checkout.totalPrice.gross.amount.toFixed(2),
        }),
      });

      const data = (await response.json()) as CreatePayPalOrderResponse;

      if (!response.ok) {
        throw new Error(getPayPalUserErrorMessage(data.errorCode, data.error));
      }

      if (!data.paypalOrderId) {
        throw new Error("No fue posible iniciar el pago con PayPal.");
      }

      return {
        orderId: data.paypalOrderId,
      };
    } catch (error) {
      console.error("PayPal create order failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar el pago con PayPal.",
      );

      throw error;
    }
  };

  const handleApprove = async (
    data: OnApproveDataOneTimePayments,
  ): Promise<void> => {
    setErrorMessage(null);

    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkoutId: checkout.id,
          paypalOrderId: data.orderId,
        }),
      });

      const result = (await response.json()) as CapturePayPalOrderResponse;

      if (!response.ok) {
        throw new Error(
          getPayPalUserErrorMessage(result.errorCode, result.error),
        );
      }

      if (result.status !== "COMPLETED") {
        throw new Error(
          getPayPalUserErrorMessage(
            result.errorCode,
            "El pago no fue completado. Inténtalo nuevamente.",
          ),
        );
      }

      const confirmationUrl = paths.payment.confirmation.asPath({
        query: {
          provider: "paypal",
        },
      });

      router.push(confirmationUrl);
      router.refresh();
    } catch (error) {
      console.error("PayPal capture order failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible completar el pago con PayPal.",
      );

      throw error;
    }
  };

  const handleCancel = (_data: OnCancelDataOneTimePayments): void => {
    setErrorMessage("El pago con PayPal fue cancelado.");
  };

  const handleError = (error: OnErrorData): void => {
    console.error("PayPal payment failed:", error);

    setErrorMessage(
      "No fue posible procesar el pago con PayPal. Intenta nuevamente o usa otro método de pago.",
    );
  };

  return (
    <div className="w-full max-w-none">
      {errorMessage && (
        <p className="mb-3 text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <PayPalOneTimePaymentButton
        createOrder={createOrder}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onError={handleError}
        presentationMode="auto"
        {...({
          style: {
            disableMaxWidth: true,
          },
        } as Record<string, unknown>)}
      />
    </div>
  );
}
