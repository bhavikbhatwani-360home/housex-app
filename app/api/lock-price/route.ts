import { prisma } from "@/lib/db";
import { notifyDeveloper } from "@/lib/notify";

export const runtime = "nodejs";

// A buyer locks a specific unit's offer price (the FOMO discount). Captured as a
// high-intent lead and routed to the developer. Requires a verified phone (OTP).
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? Math.round(x) : 0;
  };

  const propertyId = s(body.propertyId) || undefined;
  const propertyName = s(body.propertyName);
  const buyerName = s(body.buyerName);
  const buyerPhone = s(body.buyerPhone);
  const floor = n(body.floor);
  const offerPriceLakh = n(body.offerPriceLakh);
  const listPriceLakh = n(body.listPriceLakh);
  const facing = s(body.facing);
  const tag = s(body.tag);

  if (!propertyName || !offerPriceLakh) return Response.json({ error: "Missing offer details." }, { status: 400 });
  if (buyerName.length < 2 || buyerPhone.replace(/\D/g, "").length < 10)
    return Response.json({ error: "Enter your name and a valid phone number." }, { status: 400 });

  // verified phone required (OTP) — keeps every price-lock a real, reachable lead
  const digits = buyerPhone.replace(/\D/g, "").slice(-10);
  const verified = await prisma.otpCode
    .findFirst({ where: { phone: digits, verified: true, expiresAt: { gt: new Date() } } })
    .catch(() => null);
  if (!verified) return Response.json({ error: "Please verify your phone number first." }, { status: 403 });

  const save = listPriceLakh > offerPriceLakh ? listPriceLakh - offerPriceLakh : 0;
  const unitLabel = [floor ? `Floor ${floor}` : "", facing ? `${facing}-facing` : "", tag].filter(Boolean).join(" · ");

  try {
    let ownerDeveloperId: string | null = null;
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { developerId: true } });
      ownerDeveloperId = prop?.developerId ?? null;
    }

    const intent =
      `Wants to LOCK ₹${offerPriceLakh} L on ${propertyName}` +
      (unitLabel ? ` (${unitLabel})` : "") +
      (save ? ` — saving ₹${save} L` : "");

    await prisma.lead.create({
      data: {
        status: "Price lock requested",
        intent: intent.slice(0, 280),
        interestedProperty: propertyName,
        name: buyerName,
        phone: buyerPhone,
        budgetLakh: offerPriceLakh,
        ...(ownerDeveloperId ? { developerId: ownerDeveloperId } : {}),
      },
    });

    if (ownerDeveloperId) {
      await notifyDeveloper(
        ownerDeveloperId,
        `Price lock — ${propertyName}`,
        "🔒 A buyer locked your offer price",
        `<p><strong>${buyerName}</strong> (${buyerPhone}) wants to lock <strong>₹${offerPriceLakh} L</strong> on <strong>${propertyName}</strong>${unitLabel ? ` (${unitLabel})` : ""}.</p>
         ${save ? `<p>That's <strong>₹${save} L off</strong> the marked price.</p>` : ""}
         <p>This is a hot, ready-to-move buyer — call them fast to confirm the deal.</p>`,
        "/developer/leads"
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Lock price error:", err);
    return Response.json({ error: "Could not send — try again." }, { status: 500 });
  }
}
