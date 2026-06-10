import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getMember } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember();
  if (!member) return Response.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const offerPriceLakh = Number(body.offerPriceLakh);
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const validUntil = typeof body.validUntil === "string" ? body.validUntil.trim() : "";
  if (!Number.isFinite(offerPriceLakh) || offerPriceLakh <= 0) {
    return Response.json({ error: "Enter a valid offer price (in ₹ lakh)." }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, developerId: member.developerId },
      include: { conversation: true },
    });
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    let conversationId = lead.conversation?.id;
    if (!conversationId) {
      const conv = await prisma.conversation.create({ data: { id: randomUUID(), leadId: lead.id } });
      conversationId = conv.id;
    }

    // try to find the property (for list price + id)
    let propertyId: string | null = null;
    let listPriceLakh: number | null = null;
    let propertyName = lead.interestedProperty || "your home";
    if (lead.interestedProperty) {
      const prop = await prisma.property.findFirst({
        where: { developerId: member.developerId, name: lead.interestedProperty },
        select: { id: true, name: true, priceMin: true },
      });
      if (prop) {
        propertyId = prop.id;
        listPriceLakh = prop.priceMin;
        propertyName = prop.name;
      }
    }

    await prisma.offer.create({
      data: {
        conversationId, leadId: lead.id, developerId: member.developerId, propertyId, propertyName,
        listPriceLakh, offerPriceLakh: Math.trunc(offerPriceLakh), note: note || null, validUntil: validUntil || null,
      },
    });

    if (lead.status === "New" || lead.status === "Contacted") {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "Offer sent" } });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Send offer error:", err);
    return Response.json({ error: "Could not send offer." }, { status: 500 });
  }
}
