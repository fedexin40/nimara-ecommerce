"use client";

import {
  type OnApproveDataOneTimePayments,
  type OnCancelDataOneTimePayments,
  type OnErrorData,
  PayPalOneTimePaymentButton,
  PayPalProvider,
} from "@paypal/react-paypal-js/sdk-v6";

import { type Checkout } from "@nimara/domain/objects/Checkout";
import { useRouter } from "@nimara/i18n/routing";

import { paths } from "@/foundation/routing/paths";

type PayPalPaymentProps = {
  checkout: Checkout;
  onUpdateBillingAddress: () => Promise<void>;
};

type CreatePayPalOrderResponse = {
  error?: string;
  paypalOrderId: string;
};

type CapturePayPalOrderResponse = {
  captureId: string;
  error?: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
};

const PAYPAL_ENVIRONMENT =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";

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

  const createOrder = async (): Promise<{ orderId: string }> => {
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
      throw new Error(data.error ?? "Failed to create PayPal order");
    }

    return {
      orderId: data.paypalOrderId,
    };
  };

  const handleApprove = async (
    data: OnApproveDataOneTimePayments,
  ): Promise<void> => {
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
      throw new Error(result.error ?? "Failed to capture PayPal order");
    }

    if (result.status !== "COMPLETED") {
      throw new Error(`Unexpected PayPal status: ${result.status}`);
    }

    const confirmationUrl = paths.payment.confirmation.asPath({
      query: {
        provider: "paypal",
      },
    });

    router.push(confirmationUrl);
    router.refresh();
  };

  const handleCancel = (_data: OnCancelDataOneTimePayments): void => {};

  const handleError = (error: OnErrorData): void => {
    console.error("PayPal payment failed:", error);
  };

  return (
    <div className="w-full max-w-none">
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
