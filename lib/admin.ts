import { cookies } from "next/headers";
import { createHash } from "crypto";

export const ADMIN_COOKIE = "hx_admin";

export function expectedToken() {
  const pw = process.env.ADMIN_PASSWORD || "";
  return createHash("sha256").update("housex:" + pw).digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = await cookies();
  return c.get(ADMIN_COOKIE)?.value === expectedToken();
}
