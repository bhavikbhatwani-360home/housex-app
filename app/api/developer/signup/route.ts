import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DEV_COOKIE, hashPassword, signSession } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const email = s(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const company = s(body.company);
  const name = s(body.name);
  const phone = s(body.phone);

  if (!email || !email.includes("@")) return Response.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  if (!company) return Response.json({ error: "Enter your company name." }, { status: 400 });

  try {
    const existing = await prisma.developer.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "An account with this email already exists." }, { status: 409 });

    const dev = await prisma.developer.create({
      data: { email, passwordHash: hashPassword(password), company, name: name || null, phone: phone || null },
    });
    const c = await cookies();
    c.set(DEV_COOKIE, signSession(dev.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json({ error: "Could not create account — is the database connected?" }, { status: 500 });
  }
}
