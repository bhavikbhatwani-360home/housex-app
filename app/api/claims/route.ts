import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Light per-instance rate limit so the public claim form can't be spammed.
const hits = new Map<string, number[]>();
const LIMIT = 8, WINDOW = 10 * 60_000;
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  if (arr.length >= LIMIT) return true;
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (limited(ip)) return Response.json({ error: "Too many requests — try again in a bit." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const propertyId = s(body.propertyId);
  const name = s(body.name).slice(0, 120);
  const company = s(body.company).slice(0, 160);
  const email = s(body.email).slice(0, 160);
  const phone = s(body.phone).replace(/[^\d+ ]/g, "").slice(0, 20);
  const message = s(body.message).slice(0, 1000) || null;

  if (!propertyId || !name || !company || !email || phone.replace(/\D/g, "").length < 10)
    return Response.json({ error: "Please fill your name, company, email and a valid phone number." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, developerId: true } });
    if (!prop) return Response.json({ error: "That listing no longer exists." }, { status: 404 });
    if (prop.developerId) return Response.json({ error: "This listing is already claimed by its developer." }, { status: 409 });

    await prisma.listingClaim.create({
      data: { propertyId, name, company, email, phone, message, status: "Pending" },
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Claim submit error:", err);
    return Response.json({ error: "Could not submit — please try again." }, { status: 500 });
  }
}
