import { cookies } from "next/headers";
import { ADMIN_COOKIE, tokenFor, signStaff, verifyPassword, type AdminRole } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // ── staff account login (username + password) ──
  if (username) {
    const u = await prisma.staffUser.findUnique({ where: { username } }).catch(() => null);
    if (!u || !u.active || !verifyPassword(password, u.passwordHash))
      return Response.json({ error: "Wrong username or password." }, { status: 401 });
    const role: AdminRole = u.role === "super" ? "super" : "sub";
    (await cookies()).set(ADMIN_COOKIE, signStaff(u.id), cookieOpts);
    return Response.json({ ok: true, role });
  }

  // ── legacy owner login (password only) ──
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Enter your username and password." }, { status: 400 });
  }
  let role: AdminRole | null = null;
  if (password && password === process.env.ADMIN_PASSWORD) role = "super";
  else if (password && process.env.SUBADMIN_PASSWORD && password === process.env.SUBADMIN_PASSWORD) role = "sub";
  if (!role) return Response.json({ error: "Incorrect password." }, { status: 401 });

  (await cookies()).set(ADMIN_COOKIE, tokenFor(role), cookieOpts);
  return Response.json({ ok: true, role });
}
