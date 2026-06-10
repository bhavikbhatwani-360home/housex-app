import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DEV_COOKIE, verifyResetToken, hashPassword, signSession } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });

  const verified = await verifyResetToken(token);
  if (!verified) return Response.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });

  try {
    const member = await prisma.teamMember.update({
      where: { id: verified.id },
      data: { passwordHash: hashPassword(password) },
    });
    const c = await cookies();
    c.set(DEV_COOKIE, signSession(member.id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return Response.json({ error: "Could not reset — try again." }, { status: 500 });
  }
}
