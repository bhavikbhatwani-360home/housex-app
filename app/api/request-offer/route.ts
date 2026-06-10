import { prisma } from "@/lib/db";
import { notifyDeveloper } from "@/lib/notify";

export const runtime = "nodejs";

// A buyer asks the developer for a price on a specific home (from the property
// page). Captured as a lead and routed to the developer who owns the listing.
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
  const targetPriceLakh = n(body.targetPriceLakh);
  const note = s(body.note).slice(0, 500);

  if (!propertyName) return Response.json({ error: "Missing property." }, { status: 400 });
  if (buyerName.length < 2 || buyerPhone.replace(/\D/g, "").length < 10)
    return Response.json({ error: "Enter your name and a valid phone number." }, { status: 400 });

  try {
    let ownerDeveloperId: string | null = null;
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { developerId: true } });
      ownerDeveloperId = prop?.developerId ?? null;
    }

    const intent =
      `Wants a price/offer on ${propertyName}` +
      (targetPriceLakh ? ` — target ₹${targetPriceLakh} L` : "") +
      (note ? ` — "${note}"` : "");

    await prisma.lead.create({
      data: {
        status: "Offer requested",
        intent: intent.slice(0, 280),
        interestedProperty: propertyName,
        name: buyerName,
        phone: buyerPhone,
        ...(targetPriceLakh ? { budgetLakh: targetPriceLakh } : {}),
        ...(ownerDeveloperId ? { developerId: ownerDeveloperId } : {}),
      },
    });

    if (ownerDeveloperId) {
      await notifyDeveloper(
        ownerDeveloperId,
        `Offer request — ${propertyName}`,
        "💰 A buyer wants your best price",
        `<p><strong>${buyerName}</strong> (${buyerPhone}) is asking for a price on <strong>${propertyName}</strong>.</p>
         ${targetPriceLakh ? `<p>Target: <strong>₹${targetPriceLakh} L</strong></p>` : ""}
         ${note ? `<p>Note: ${note}</p>` : ""}
         <p>Send an offer back fast — buyers who ask are ready to move.</p>`,
        "/developer/leads"
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Request offer error:", err);
    return Response.json({ error: "Could not send — is the database connected?" }, { status: 500 });
  }
}
