import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const TOKEN_AMOUNT = 999;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const conversationId = s(body.conversationId) || undefined;
  const propertyId = s(body.propertyId) || undefined;
  const propertyName = s(body.propertyName);
  const unitFloorRaw = Number(body.unitFloor);
  const unitFloor = Number.isFinite(unitFloorRaw) && unitFloorRaw > 0 ? Math.trunc(unitFloorRaw) : null;
  const buyerName = s(body.buyerName);
  const buyerPhone = s(body.buyerPhone);
  const buyerPan = s(body.buyerPan) || null;

  if (!propertyName) return Response.json({ error: "Missing property." }, { status: 400 });
  if (!buyerName || !buyerPhone) return Response.json({ error: "Enter your name and phone." }, { status: 400 });

  try {
    // resolve / create the lead via the conversation
    let leadId: string | undefined;
    if (conversationId) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv?.leadId) leadId = conv.leadId;
      else {
        const lead = await prisma.lead.create({ data: { status: "Token paid", intent: `Token: ${propertyName}` } });
        await prisma.conversation.upsert({
          where: { id: conversationId },
          create: { id: conversationId, leadId: lead.id },
          update: { leadId: lead.id },
        });
        leadId = lead.id;
      }
    }

    // owning developer (route the lead to them)
    let developerId: string | null = null;
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { developerId: true } });
      developerId = prop?.developerId ?? null;
    }

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { interestedProperty: propertyName, status: "Token paid", ...(developerId ? { developerId } : {}) },
      });
    }

    // DEMO payment — marked Paid. (When RAZORPAY keys are added we'll create a real
    // order here and confirm via signature before marking Paid.)
    const booking = await prisma.booking.create({
      data: {
        propertyId: propertyId ?? null, propertyName, unitFloor,
        leadId: leadId ?? null, developerId,
        buyerName, buyerPhone, buyerPan,
        amount: TOKEN_AMOUNT, status: "Paid", paymentRef: "demo-" + Date.now(),
      },
    });

    return Response.json({ ok: true, bookingId: booking.id, summary: `${propertyName}${unitFloor ? ` · floor ${unitFloor}` : ""} · ₹${TOKEN_AMOUNT} token` });
  } catch (err) {
    console.error("Token error:", err);
    return Response.json({ error: "Could not complete — is the database connected?" }, { status: 500 });
  }
}
