import { prisma } from "@/lib/db";
import { notifyDeveloper } from "@/lib/notify";

export const runtime = "nodejs";

// Buyer responds to an offer: accept / decline / counter.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const counterPriceLakh = Number(body.counterPriceLakh);

  if (!["accept", "decline", "counter"].includes(action)) {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action === "counter" && (!Number.isFinite(counterPriceLakh) || counterPriceLakh <= 0)) {
    return Response.json({ error: "Enter a valid counter price." }, { status: 400 });
  }

  try {
    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) return Response.json({ error: "Offer not found." }, { status: 404 });
    if (offer.status !== "Pending") return Response.json({ error: "This offer was already answered." }, { status: 409 });

    const status = action === "accept" ? "Accepted" : action === "decline" ? "Declined" : "Countered";
    await prisma.offer.update({
      where: { id },
      data: { status, ...(action === "counter" ? { counterPriceLakh: Math.trunc(counterPriceLakh) } : {}) },
    });

    // reflect on the lead
    if (offer.leadId) {
      const leadStatus = action === "accept" ? "Offer accepted" : action === "counter" ? "Countered" : "Offer declined";
      await prisma.lead.update({ where: { id: offer.leadId }, data: { status: leadStatus } }).catch(() => {});
    }

    // alert the developer's team (no-op until RESEND_API_KEY is set)
    if (offer.developerId) {
      const headline =
        action === "accept" ? `🎉 Offer ACCEPTED — ${offer.propertyName}`
        : action === "counter" ? `Buyer countered ₹${Math.trunc(counterPriceLakh)} L — ${offer.propertyName}`
        : `Offer declined — ${offer.propertyName}`;
      const detail =
        action === "accept"
          ? `<p>The buyer <strong>accepted</strong> your offer of <strong>₹${offer.offerPriceLakh} L</strong> on <strong>${offer.propertyName}</strong>. Reach out now to close.</p>`
          : action === "counter"
          ? `<p>The buyer countered your ₹${offer.offerPriceLakh} L offer with <strong>₹${Math.trunc(counterPriceLakh)} L</strong> on <strong>${offer.propertyName}</strong>. Reply quickly to keep the deal warm.</p>`
          : `<p>The buyer declined your ₹${offer.offerPriceLakh} L offer on <strong>${offer.propertyName}</strong>. You can send a revised offer from the lead.</p>`;
      await notifyDeveloper(offer.developerId, headline, headline, detail, "/developer/offers");
    }

    return Response.json({ ok: true, status });
  } catch (err) {
    console.error("Respond offer error:", err);
    return Response.json({ error: "Could not submit your response." }, { status: 500 });
  }
}
