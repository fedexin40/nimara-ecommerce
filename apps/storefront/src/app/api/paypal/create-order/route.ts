import { NextResponse } from "next/server";

type CreateOrderBody = {
  amount: string;
  checkoutId: string;
};

type CreateOrderRouteResponse = {
  error?: string;
  errorCode?: string;
  paypalOrderId: string;
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

type PayPalCreateOrderResponse = PayPalErrorResponse & {
  id?: string;
  links?: Array<{
    href: string;
    method: string;
    rel: string;
  }>;
  purchase_units?: Array<{
    custom_id?: string;
  }>;
  status?: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED";
};

type PayPalAccessTokenResponse = PayPalErrorResponse & {
  access_token?: string;
  app_id?: string;
  expires_in?: number;
  nonce?: string;
  scope?: string;
  token_type?: "Bearer";
};

const PAYPAL_API =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

function getPayPalErrorCode(data: PayPalErrorResponse) {
  return data.details?.[0]?.issue ?? data.name ?? data.error;
}

function getPayPalErrorMessage(data: PayPalErrorResponse) {
  return (
    data.details?.[0]?.description ??
    data.message ??
    data.error_description ??
    data.error ??
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

  const data = (await response.json()) as PayPalAccessTokenResponse;

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
    const body = (await request.json()) as Partial<CreateOrderBody>;

    if (!body.checkoutId) {
      return NextResponse.json<CreateOrderRouteResponse>(
        {
          paypalOrderId: "",
          errorCode: "MISSING_CHECKOUT_ID",
          error: "Missing checkoutId",
        },
        { status: 400 },
      );
    }

    if (!body.amount) {
      return NextResponse.json<CreateOrderRouteResponse>(
        {
          paypalOrderId: "",
          errorCode: "MISSING_AMOUNT",
          error: "Missing amount",
        },
        { status: 400 },
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: body.checkoutId,
            amount: {
              currency_code: "MXN",
              value: body.amount,
            },
          },
        ],
      }),
      cache: "no-store",
    });

    const paypalOrder = (await response.json()) as PayPalCreateOrderResponse;

    if (!response.ok) {
      console.error("PayPal create order error:", paypalOrder);

      return NextResponse.json<CreateOrderRouteResponse>(
        {
          paypalOrderId: "",
          errorCode: getPayPalErrorCode(paypalOrder),
          error: getPayPalErrorMessage(paypalOrder),
        },
        { status: response.status },
      );
    }

    if (!paypalOrder.id) {
      return NextResponse.json<CreateOrderRouteResponse>(
        {
          paypalOrderId: "",
          errorCode: "PAYPAL_ORDER_ID_NOT_FOUND",
          error: "PayPal order ID not found",
        },
        { status: 400 },
      );
    }

    return NextResponse.json<CreateOrderRouteResponse>({
      paypalOrderId: paypalOrder.id,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);

    return NextResponse.json<CreateOrderRouteResponse>(
      {
        paypalOrderId: "",
        errorCode: "INTERNAL_SERVER_ERROR",
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
