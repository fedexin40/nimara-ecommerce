import { type NextRequest, NextResponse } from "next/server";

import { stripe_secret_key } from "@nimara/infrastructure/payment/stripe/infrastructure/create-secrete-key";

type UpdatePaymentIntentBody = {
  amount: number;
  paymentIntentId: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdatePaymentIntentBody;

    const { paymentIntentId, amount } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        {
          error: "paymentIntentId is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          error: "amount must be greater than 0",
        },
        {
          status: 400,
        },
      );
    }

    const paymentIntent = await stripe_secret_key.paymentIntents.update(
      paymentIntentId,
      {
        amount: Math.round(amount),
      },
    );

    return NextResponse.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("Update PaymentIntent error:", error);

    return NextResponse.json(
      {
        error: "Failed to update PaymentIntent",
      },
      {
        status: 500,
      },
    );
  }
}
