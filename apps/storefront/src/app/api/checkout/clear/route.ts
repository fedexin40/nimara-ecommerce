import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_KEY } from "@/config";
import { paths } from "@/foundation/routing/paths";

export async function GET(request: Request) {
  const cookieStore = await cookies();

  if (cookieStore.has(COOKIE_KEY.checkout)) {
    cookieStore.delete(COOKIE_KEY.checkout);
  }

  const { searchParams } = new URL(request.url);
  const shouldRedirect = searchParams.get("redirect") === "true";

  if (shouldRedirect) {
    redirect(paths.cart.asPath());
  }

  return Response.json({ success: true });
}
