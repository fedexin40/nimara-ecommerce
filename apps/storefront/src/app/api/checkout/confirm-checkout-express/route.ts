import { NextResponse } from "next/server";

import {
  createCheckoutShippingAddress,
  updateCheckoutDeliveryMethod,
  updateCheckoutUserDetailsAction,
} from "@/foundation/checkout";
import { updateBillingAddress } from "@/foundation/checkout/sections/payment/actions";
import { getCurrentRegion } from "@/foundation/regions";
import { getServiceRegistry } from "@/services/registry";

type ExpressShippingRequestBody = {
  checkoutId: string;
  email: string;
  shippingAddressInput: Parameters<
    typeof createCheckoutShippingAddress
  >[0]["input"];
  shippingMethodName: string;
  shippingMethodPrice: number;
};

const normalizeCarrierName = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  try {
    const {
      checkoutId,
      shippingMethodName,
      shippingMethodPrice,
      shippingAddressInput,
      email,
    } = (await request.json()) as ExpressShippingRequestBody;

    const getUpdatedCheckout = async () => {
      const checkoutResult = await checkoutService.checkoutGet({
        checkoutId,
        languageCode: region.language.code,
        countryCode: shippingAddressInput.country ?? region.market.countryCode,
        options: {
          cache: "no-store",
        },
      });

      if (!checkoutResult.ok || !checkoutResult.data?.checkout) {
        return null;
      }

      return checkoutResult.data.checkout;
    };

    if (!checkoutId) {
      return NextResponse.json(
        { ok: false, error: "checkoutId is required." },
        { status: 400 },
      );
    }

    if (!shippingMethodName) {
      return NextResponse.json(
        { ok: false, error: "shippingMethodName is required." },
        { status: 400 },
      );
    }

    if (shippingMethodPrice === undefined || shippingMethodPrice === null) {
      return NextResponse.json(
        { ok: false, error: "shippingMethodPrice is required." },
        { status: 400 },
      );
    }

    if (!shippingAddressInput) {
      return NextResponse.json(
        { ok: false, error: "shippingAddressInput is required." },
        { status: 400 },
      );
    }

    const [services, region] = await Promise.all([
      getServiceRegistry(),
      getCurrentRegion(),
    ]);

    const checkoutService = await services.getCheckoutService();

    const shippingAddressResult = await createCheckoutShippingAddress({
      id: checkoutId,
      input: shippingAddressInput,
    });

    if (!shippingAddressResult.ok) {
      return NextResponse.json(shippingAddressResult, { status: 400 });
    }

    const checkout = await getUpdatedCheckout();

    if (!checkout) {
      return NextResponse.json(
        {
          ok: false,
          error: "Checkout not found after shipping address update.",
        },
        { status: 404 },
      );
    }

    const updateEmailResult = await updateCheckoutUserDetailsAction({
      checkout,
      email,
    });

    if (!updateEmailResult.ok) {
      return NextResponse.json(
        { ok: false, error: "Email was not updated." },
        { status: 400 },
      );
    }

    if (!checkout) {
      return NextResponse.json(
        { ok: false, error: "Checkout not found after email update." },
        { status: 404 },
      );
    }

    const billingAddressResult = await updateBillingAddress({
      checkout,
      input: {
        sameAsShippingAddress: false,
        billingAddress: shippingAddressInput,
        saveAddressForFutureUse: false,
      },
      revalidateCheckout: false,
    });

    if (!billingAddressResult.ok) {
      return NextResponse.json(billingAddressResult.errors, { status: 400 });
    }

    const shippingMethods = checkout.shippingMethods;

    const stripePrice = Math.round(Number(shippingMethodPrice));

    const selectedShippingMethod = shippingMethods
      ?.filter(
        (method: {
          id: string;
          name: string;
          price: {
            amount: number;
            currency: string;
          };
        }) =>
          normalizeCarrierName(method.name).includes(
            normalizeCarrierName(shippingMethodName),
          ),
      )
      .sort((a, b) => {
        const priceA = Math.round(a.price.amount * 100);
        const priceB = Math.round(b.price.amount * 100);

        const diffA = Math.abs(priceA - stripePrice);
        const diffB = Math.abs(priceB - stripePrice);

        if (diffA !== diffB) {
          return diffA - diffB;
        }

        return priceA - priceB;
      })[0];

    if (!selectedShippingMethod) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Selected shipping method name and price are not available for this checkout.",
        },
        { status: 400 },
      );
    }

    const deliveryMethodResult = await updateCheckoutDeliveryMethod({
      id: checkoutId,
      deliveryMethodId: selectedShippingMethod.id,
    });

    if (!deliveryMethodResult.ok) {
      return NextResponse.json(deliveryMethodResult, { status: 400 });
    }

    if (!checkout) {
      return NextResponse.json(
        {
          ok: false,
          error: "Checkout not found after delivery method update.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      shippingAddress: checkout.shippingAddress,
      billingAddress: checkout.billingAddress,
      deliveryMethod: checkout.deliveryMethod,
    });
  } catch (error) {
    console.error("Express shipping API error:", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
