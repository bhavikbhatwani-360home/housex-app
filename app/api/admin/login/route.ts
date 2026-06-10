import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenFor, type AdminRole } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "Admin password not set. Add ADMIN_PASSWORD to your environment variables." },
      { status: 400 }
    );
  }
  const { password } = await req.json().catch(() => ({ password: "" }));

  let role: AdminRole | null = null;
  if (password && password === process.env.ADMIN_PASSWORD) role = "super";
  else if (password && process.env.SUBADMIN_PASSWORD && password === process.env.SUBADMIN_PASSWORD) role = "sub";

  if (!role) return Response.json({ error: "Incorrect password." }, { status: 401 });

  const c = await cookies();
  c.set(ADMIN_COOKIE, tokenFor(role), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true, role });
}
