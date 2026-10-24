import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const META_EXTERNAL_ID_COOKIE = "_meta_external_id";
const META_EXTERNAL_ID_MAX_AGE = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const existingExternalId = request.cookies.get(
      META_EXTERNAL_ID_COOKIE,
    )?.value;

    const externalId = existingExternalId || randomUUID();

    const response = NextResponse.json(
      {
        success: true,
        externalId,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    if (!existingExternalId) {
      response.cookies.set({
        name: META_EXTERNAL_ID_COOKIE,
        value: externalId,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: META_EXTERNAL_ID_MAX_AGE,
      });
    }

    return response;
  } catch {
    console.error("Unable to initialize Meta external ID");

    return NextResponse.json(
      {
        success: false,
        error: "Unable to initialize Meta identity",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
