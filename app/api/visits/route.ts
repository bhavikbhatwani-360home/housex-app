import { prisma } from "@/lib/db";
import { notifyDeveloper } from "@/lib/notify";

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
  const who = s(body.who).slice(0, 60);
  const note = s(body.note).slice(0, 400);
  const buyerName = s(body.buyerName);
  const buyerPhone = s(body.buyerPhone);

  if (!propertyName || !date || !slot) {
    return Response.json({ error: "Missing visit details." }, { status: 400 });
  }
  if (buyerName.length < 2 || buyerPhone.replace(/\D/g, "").length < 10) {
    return Response.json({ error: "Enter your name and a valid phone number." }, { status: 400 });
  }

  // Property-page bookings (no chat conversation) must verify the phone via OTP
  // — this keeps every developer lead a real, reachable one. Chat bookings keep
  // their existing flow.
  if (!conversationId) {
    const digits = buyerPhone.replace(/\D/g, "").slice(-10);
    const verified = await prisma.otpCode
      .findFirst({ where: { phone: digits, verified: true, expiresAt: { gt: new Date() } } })
      .catch(() => null);
    if (!verified) return Response.json({ error: "Please verify your phone number first." }, { status: 403 });
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

    // a booking straight from a property page has no conversation — create a
    // standalone lead so it still lands in the dashboard and routes to the dev
    if (!leadId) {
      const lead = await prisma.lead.create({
        data: {
          status: "Visit booked",
          intent: `Site visit: ${propertyName}`,
          ...(ownerDeveloperId ? { developerId: ownerDeveloperId } : {}),
        },
      });
      leadId = lead.id;
    }

    if (leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          interestedProperty: propertyName,
          status: "Visit booked",
          name: buyerName,
          phone: buyerPhone,
          ...(ownerDeveloperId ? { developerId: ownerDeveloperId } : {}),
        },
      });
    }

    const visit = await prisma.visit.create({
      data: { propertyId: propertyId ?? null, propertyName, leadId: leadId ?? null, date, slot, mode, buyerName, buyerPhone },
    });

    // alert the developer's team (best-effort; no-op until RESEND_API_KEY is set)
    if (ownerDeveloperId) {
      await notifyDeveloper(
        ownerDeveloperId,
        `New site visit — ${propertyName}`,
        "🎉 New site visit booked",
        `<p><strong>${buyerName}</strong> (${buyerPhone}) booked a <strong>${mode.toLowerCase()}</strong> visit to <strong>${propertyName}</strong>.</p>
         <p><strong>${date} · ${slot}</strong>${who ? ` · ${who}` : ""}</p>
         ${note ? `<p>Buyer's note: “${note}”</p>` : ""}
         <p>Respond quickly — fast replies convert far better.</p>`,
        "/developer/visits"
      );
    }

    // short human-friendly reference for the buyer's pass
    const ref = "HX-" + visit.id.slice(-5).toUpperCase();
    return Response.json({ ok: true, ref, summary: `${propertyName} · ${date} · ${slot} · ${mode}` });
  } catch (err) {
    console.error("Create visit error:", err);
    return Response.json({ error: "Could not book — is the database connected?" }, { status: 500 });
  }
}
