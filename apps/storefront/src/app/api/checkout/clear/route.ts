import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_KEY } from "@/config";

export async function GET() {
  const cookieStore = await cookies();

  if (cookieStore.has(COOKIE_KEY.checkout)) {
    cookieStore.delete(COOKIE_KEY.checkout);
  }

  redirect("/checkout-cleanup");
}
