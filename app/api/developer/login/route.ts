import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DEV_COOKIE, verifyPassword, signSession } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) return Response.json({ error: "Enter your email and password." }, { status: 400 });

  try {
    const dev = await prisma.developer.findUnique({ where: { email } });
    if (!dev || !verifyPassword(password, dev.passwordHash)) {
      return Response.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    const c = await cookies();
    c.set(DEV_COOKIE, signSession(dev.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Could not sign in — is the database connected?" }, { status: 500 });
  }
}
