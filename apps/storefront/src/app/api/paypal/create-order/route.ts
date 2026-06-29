// src/app/api/paypal/create-order/route.ts

import { NextResponse } from "next/server";

type CreateOrderBody = {
  amount: string;
  checkoutId: string;
};

type PayPalCreateOrderResponse = {
  details?: Array<{
    description: string;
    issue: string;
  }>;
  id: string;
  links?: Array<{
    href: string;
    method: string;
    rel: string;
  }>;
  message?: string;
  purchase_units?: Array<{
    custom_id?: string;
  }>;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED";
};

type PayPalAccessTokenResponse = {
  access_token: string;
  app_id: string;
  expires_in: number;
  nonce: string;
  scope: string;
  token_type: "Bearer";
};

const PAYPAL_API =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = (await response.json()) as PayPalAccessTokenResponse;

  if (!response.ok) {
    console.error("PayPal auth error:", data);
    throw new Error("Could not authenticate with PayPal");
  }

  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;

    if (!body.checkoutId) {
      return NextResponse.json(
        {
          paypalOrderId: "",
          error: "Missing checkoutId",
        },
        { status: 400 },
      );
    }

    if (!body.amount) {
      return NextResponse.json(
        {
          paypalOrderId: "",
          error: "Missing amount",
        },
        { status: 400 },
      );
    }

    const amount = body.amount;

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
              value: amount,
            },
          },
        ],
      }),
      cache: "no-store",
    });

    const paypalOrder = (await response.json()) as PayPalCreateOrderResponse;

    if (!response.ok) {
      console.error("PayPal create order error:", paypalOrder);

      return NextResponse.json(
        {
          paypalOrderId: "",
          error: paypalOrder.message ?? "Failed to create PayPal order",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
    });
  } catch (error) {
    console.error("PayPal create-order error:", error);

    return NextResponse.json(
      {
        paypalOrderId: "",
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
