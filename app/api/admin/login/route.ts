import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "Admin password not set. Add ADMIN_PASSWORD to your environment variables." },
      { status: 400 }
    );
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }
  const c = await cookies();
  c.set(ADMIN_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
}
