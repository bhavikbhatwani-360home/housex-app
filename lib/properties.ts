import { prisma } from "./db";

/**
 * Build a compact, real inventory summary for Baba's context.
 * Returns null if the DB is unavailable or empty (caller falls back to static).
 */
export async function getInventoryContext(): Promise<string | null> {
  try {
    const props = await prisma.property.findMany({
      include: { units: { where: { available: true }, orderBy: { floor: "asc" } } },
      orderBy: { priceMin: "asc" },
      take: 40,
    });
    if (props.length === 0) return null;
    return props
      .map((p) => {
        const units = p.units
          .map((u) => `floor ${u.floor} = ₹${u.priceLakh}L ${u.facing} ${u.carpetSqft}sqft`)
          .join("; ");
        const amen = p.amenities.length ? ` Amenities: ${p.amenities.join(", ")}.` : "";
        const broch = p.brochureUrl ? " Brochure available." : "";
        return `- ${p.name} by ${p.developer} — ${p.locality}, ${p.city}. ${p.bhk}, ₹${p.priceMin}–${p.priceMax}L, ${p.facing}-facing base, ${p.distanceToStationM} m from station, RERA ${p.reraId}, ${p.status}. Available units: ${units}.${amen}${broch}`;
      })
      .join("\n");
  } catch {
    return null;
  }
}

/**
 * Persist a chat turn: ensure a conversation (and its lead) exist, then append
 * the user + Baba messages. Best-effort — never throws into the request path.
 */
export async function persistTurn(
  conversationId: string | undefined,
  userText: string,
  babaText: string
): Promise<void> {
  if (!conversationId) return;
  try {
    const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!existing) {
      const lead = await prisma.lead.create({
        data: { status: "New", intent: userText.slice(0, 280) },
      });
      await prisma.conversation.create({ data: { id: conversationId, leadId: lead.id } });
    }
    await prisma.message.createMany({
      data: [
        { conversationId, role: "user", content: userText.slice(0, 4000) },
        { conversationId, role: "baba", content: babaText.slice(0, 4000) },
      ],
    });
  } catch {
    // DB not configured or unreachable — skip silently; chat still works.
  }
}
