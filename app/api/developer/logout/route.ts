import { cookies } from "next/headers";
import { DEV_COOKIE } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST() {
  const c = await cookies();
  c.delete(DEV_COOKIE);
  return Response.json({ ok: true });
}
