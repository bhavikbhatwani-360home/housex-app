import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let phone = "", code = "";
  try {
    const body = await req.json();
    phone = String(body?.phone || "").replace(/\D/g, "").slice(-10);
    code = String(body?.code || "").replace(/\D/g, "").slice(0, 6);
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (phone.length !== 10 || code.length !== 6) return Response.json({ error: "Enter the 6-digit code." }, { status: 400 });

  try {
    const row = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (!row || row.expiresAt < new Date())
      return Response.json({ error: "Code expired — request a new one." }, { status: 400 });
    if (row.attempts >= 5)
      return Response.json({ error: "Too many tries — request a new code." }, { status: 429 });

    if (row.code !== code) {
      await prisma.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      return Response.json({ error: "Wrong code — check and try again." }, { status: 400 });
    }

    await prisma.otpCode.update({ where: { id: row.id }, data: { verified: true } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("OTP verify error:", err);
    return Response.json({ error: "Could not verify — try again." }, { status: 500 });
  }
}
