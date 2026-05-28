import { type NextRequest, NextResponse } from "next/server";

const shipping_url = process.env.NEXT_PUBLIC_SHIPPING_URL;

export async function POST(request: NextRequest) {
  try {
    // Body recibido desde el frontend
    const body = await request.json();

    // Llamada server-to-server a tu app del puerto 4030
    const response = await fetch(
      `${shipping_url}/api/checkout/shipping-methods`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    // Intentar parsear respuesta
    const data = await response.json();

    // Reenviar respuesta al frontend
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Proxy shipping methods error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch shipping methods",
      },
      {
        status: 500,
      },
    );
  }
}
