import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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
  const date = s(body.date);
  const slot = s(body.slot);
  const mode = s(body.mode) || "In-person";

  if (!propertyName || !date || !slot) {
    return Response.json({ error: "Missing visit details." }, { status: 400 });
  }

  try {
    // resolve / create the lead via the conversation so the visit attaches to it
    let leadId: string | undefined;
    if (conversationId) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv?.leadId) {
        leadId = conv.leadId;
      } else {
        const lead = await prisma.lead.create({ data: { status: "Visit booked", intent: `Site visit: ${propertyName}` } });
        await prisma.conversation.upsert({
          where: { id: conversationId },
          create: { id: conversationId, leadId: lead.id },
          update: { leadId: lead.id },
        });
        leadId = lead.id;
      }
    }

    // route the lead to the developer who owns the property (if any)
    let ownerDeveloperId: string | null = null;
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId }, select: { developerId: true } });
      ownerDeveloperId = prop?.developerId ?? null;
    }

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          interestedProperty: propertyName,
          status: "Visit booked",
          ...(ownerDeveloperId ? { developerId: ownerDeveloperId } : {}),
        },
      });
    }

    await prisma.visit.create({
      data: { propertyId: propertyId ?? null, propertyName, leadId: leadId ?? null, date, slot, mode },
    });

    return Response.json({ ok: true, summary: `${propertyName} · ${date} · ${slot} · ${mode}` });
  } catch (err) {
    console.error("Create visit error:", err);
    return Response.json({ error: "Could not book — is the database connected?" }, { status: 500 });
  }
}
