import { prisma } from "@/lib/db";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-IP/phone rate limit so OTP can't be spammed.
const hits = new Map<string, number[]>();
const LIMIT = 5, WINDOW = 10 * 60_000;
function limited(key: string) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW);
  if (arr.length >= LIMIT) return true;
  arr.push(now); hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

  let phone = "";
  try {
    const body = await req.json();
    phone = String(body?.phone || "").replace(/\D/g, "").slice(-10);
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (phone.length !== 10) return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  if (limited(ip) || limited(phone)) return Response.json({ error: "Too many requests — try again in a few minutes." }, { status: 429 });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  try {
    // invalidate older codes for this phone, then store the new one
    await prisma.otpCode.deleteMany({ where: { phone } });
    await prisma.otpCode.create({ data: { phone, code, expiresAt } });
  } catch (err) {
    console.error("OTP store error:", err);
    return Response.json({ error: "Could not send code — try again." }, { status: 500 });
  }

  const { sent } = await sendSms(phone, `${code} is your HouseX verification code. Valid for 10 minutes.`);

  // In test mode (no SMS provider), surface the code so the flow is usable.
  return Response.json({ ok: true, sent, ...(sent ? {} : { devCode: code }) });
}
