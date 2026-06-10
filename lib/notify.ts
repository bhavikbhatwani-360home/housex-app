import { prisma } from "./db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://housex-app.vercel.app";

/**
 * Send an email via Resend (free tier). No-op if RESEND_API_KEY isn't set,
 * so the app works fine before email is configured.
 */
export async function sendEmail(to: string[], subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || to.length === 0) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "HouseX <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error("sendEmail error:", err);
  }
}

function emailShell(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <span style="display:inline-block;width:34px;height:34px;border-radius:9px;background:#E03943;color:#fff;text-align:center;line-height:34px;font-weight:700">HX</span>
      <strong style="font-size:16px;color:#0F172A">HouseX</strong>
    </div>
    <h2 style="font-size:18px;color:#0F172A;margin:0 0 10px">${title}</h2>
    <div style="font-size:14px;color:#334155;line-height:1.6">${bodyHtml}</div>
    <a href="${ctaUrl}" style="display:inline-block;margin-top:18px;background:#E03943;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px">${ctaLabel}</a>
    <p style="font-size:11px;color:#64748B;margin-top:22px">HouseX · AI-powered home search · This is an automated alert.</p>
  </div>`;
}

/** Email every team member of a developer org. Best-effort, never throws. */
export async function notifyDeveloper(
  developerId: string,
  subject: string,
  title: string,
  bodyHtml: string,
  ctaPath = "/developer/leads"
): Promise<void> {
  try {
    const members = await prisma.teamMember.findMany({
      where: { developerId },
      select: { email: true },
    });
    const emails = members.map((m) => m.email).filter(Boolean);
    await sendEmail(emails, subject, emailShell(title, bodyHtml, "Open your CRM", APP_URL + ctaPath));
  } catch (err) {
    console.error("notifyDeveloper error:", err);
  }
}
