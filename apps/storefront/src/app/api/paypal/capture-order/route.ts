import { NextResponse } from "next/server";

type CaptureBody = {
  checkoutId: string;
  paypalOrderId: string;
};

type CaptureOrderRouteResponse = {
  captureId: string;
  error?: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
};

type PayPalErrorResponse = {
  details?: Array<{
    description?: string;
    issue?: string;
  }>;
  error?: string;
  error_description?: string;
  message?: string;
  name?: string;
};

type PayPalAccessTokenResponse = {
  access_token: string;
  app_id?: string;
  expires_in?: number;
  nonce?: string;
  scope?: string;
  token_type: "Bearer";
};

type PayPalCaptureOrderResponse = PayPalErrorResponse & {
  id?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id?: string;
        status?: "COMPLETED" | "PENDING" | "DECLINED" | "FAILED";
      }>;
    };
  }>;
  status?: string;
};

const PAYPAL_API =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function getPayPalErrorMessage(data: PayPalErrorResponse) {
  return (
    data.message ??
    data.error_description ??
    data.error ??
    data.details?.[0]?.description ??
    "PayPal request failed"
  );
}

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials");
  }

  const auth = Buffer.from(
    `${clientId.trim()}:${clientSecret.trim()}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as PayPalAccessTokenResponse &
    PayPalErrorResponse;

  if (!response.ok) {
    console.error("PayPal auth error:", data);
    throw new Error(getPayPalErrorMessage(data));
  }

  if (!data.access_token) {
    throw new Error("PayPal access token not found");
  }

  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CaptureBody>;

    if (!body.checkoutId || !body.paypalOrderId) {
      return NextResponse.json<CaptureOrderRouteResponse>(
        {
          captureId: "",
          status: "FAILED",
          error: "Missing checkoutId or paypalOrderId",
        },
        { status: 400 },
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${body.paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const paypalOrder = (await response.json()) as PayPalCaptureOrderResponse;

    if (!response.ok) {
      console.error("PayPal capture error:", paypalOrder);

      return NextResponse.json<CaptureOrderRouteResponse>(
        {
          captureId: "",
          status: "FAILED",
          error: getPayPalErrorMessage(paypalOrder),
        },
        { status: 400 },
      );
    }

    const capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];

    if (!capture?.id) {
      return NextResponse.json<CaptureOrderRouteResponse>(
        {
          captureId: "",
          status: "FAILED",
          error: "PayPal capture ID not found",
        },
        { status: 400 },
      );
    }

    if (capture.status !== "COMPLETED") {
      return NextResponse.json<CaptureOrderRouteResponse>(
        {
          captureId: capture.id,
          status: "PENDING",
          error: `Unexpected PayPal capture status: ${capture.status ?? "UNKNOWN"}`,
        },
        { status: 202 },
      );
    }

    return NextResponse.json<CaptureOrderRouteResponse>({
      captureId: capture.id,
      status: "COMPLETED",
    });
  } catch (error) {
    console.error("PayPal capture-order error:", error);

    return NextResponse.json<CaptureOrderRouteResponse>(
      {
        captureId: "",
        status: "FAILED",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
