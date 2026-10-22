import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { getCheckoutId } from "@/features/checkout/server";
import { getServiceRegistry } from "@/services/registry";

export async function POST(request: Request) {
  try {
    // Validate same-origin requests
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get checkout ID from the current session
    const checkoutId = await getCheckoutId();

    if (!checkoutId) {
      return NextResponse.json(
        { success: false, reason: "Checkout not found" },
        { status: 404 },
      );
    }

    const [cookieStore, headersList] = await Promise.all([
      cookies(),
      headers(),
    ]);

    // Meta identifiers
    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;
    const externalId = cookieStore.get("f_external_id")?.value;

    // Browser information
    const userAgent = headersList.get("user-agent");

    // Client IP (Vercel)
    const ip =
      headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim();

    // Include only non-empty values
    const metadata = [
      { key: "fbp", value: fbp },
      { key: "fbc", value: fbc },
      { key: "f_external_id", value: externalId },
      { key: "ip", value: ip },
      { key: "userAgent", value: userAgent },
    ].filter(
      (item): item is { key: string; value: string } =>
        typeof item.value === "string" && item.value.trim().length > 0,
    );

    if (!metadata.length) {
      return NextResponse.json({ success: true });
    }

    // Update Saleor checkout metadata
    const services = await getServiceRegistry();
    const checkoutService = await services.getCheckoutService();

    const result = await checkoutService.checkoutMetadataUpdate({
      id: checkoutId,
      metadata,
    });

    if (!result.ok) {
      console.error(
        "Failed to update checkout tracking metadata:",
        result.errors,
      );

      return NextResponse.json(
        { error: "Failed to update checkout metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Checkout tracking metadata updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to update checkout tracking metadata:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
