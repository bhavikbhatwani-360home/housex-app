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
    // 1) normal: a team member with this email
    const member = await prisma.teamMember.findUnique({ where: { email } });
    if (member && verifyPassword(password, member.passwordHash)) {
      await setSession(member.id);
      return Response.json({ ok: true });
    }

    // 2) legacy: an old Developer account (pre-teams) — migrate it to an owner member
    const legacy = await prisma.developer.findUnique({ where: { email } });
    if (legacy?.passwordHash && verifyPassword(password, legacy.passwordHash)) {
      const owner = await prisma.teamMember.create({
        data: { developerId: legacy.id, email, passwordHash: legacy.passwordHash, name: legacy.name, role: "owner" },
      });
      await setSession(owner.id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Incorrect email or password." }, { status: 401 });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Could not sign in — is the database connected?" }, { status: 500 });
  }
}

async function setSession(memberId: string) {
  const c = await cookies();
  c.set(DEV_COOKIE, signSession(memberId), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
