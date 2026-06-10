import { prisma } from "@/lib/db";
import { makeResetToken } from "@/lib/devauth";
import { sendEmail } from "@/lib/notify";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://housex-app.vercel.app";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: "" }));
  const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!clean || !clean.includes("@")) return Response.json({ error: "Enter a valid email." }, { status: 400 });

  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: "Password reset by email isn't enabled yet — contact support at hello@housex.ai." },
      { status: 503 }
    );
  }

  try {
    const member = await prisma.teamMember.findUnique({ where: { email: clean } });
    if (member) {
      const link = `${APP_URL}/developer/reset?token=${makeResetToken(member.id, member.passwordHash)}`;
      await sendEmail(
        [member.email],
        "Reset your HouseX password",
        `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#0F172A;font-size:18px">Reset your HouseX password</h2>
          <p style="color:#334155;font-size:14px;line-height:1.6">Click the button below to set a new password. The link is valid for 1 hour. If you didn't request this, you can ignore this email.</p>
          <a href="${link}" style="display:inline-block;margin-top:14px;background:#E03943;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px">Set a new password</a>
        </div>`
      );
    }
    // always succeed so emails can't be probed
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return Response.json({ ok: true });
  }
}
