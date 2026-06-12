import { prisma } from "./db";
import { parseFloorPlans } from "./floorplan";

/**
 * Build a compact, real inventory summary for HouseX AI's context.
 * Returns null if the DB is unavailable or empty (caller falls back to static).
 */
export async function getInventoryContext(): Promise<string | null> {
  try {
    const props = await prisma.property.findMany({
      // Buyers/AI only ever see approved (Live) listings — Draft/Pending stay
      // internal until a manager approves them.
      where: { status: "Live" },
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
        const planLabels = Array.from(new Set(parseFloorPlans(p.floorPlans).map((fp) => fp.label).filter(Boolean)));
        const fplans = planLabels.length ? ` Floor plans: ${planLabels.join(", ")}.` : "";
        return `- ${p.name} by ${p.developer} — ${p.locality}, ${p.city}. ${p.bhk}, ₹${p.priceMin}–${p.priceMax}L, ${p.facing}-facing base, ${p.distanceToStationM} m from station, RERA ${p.reraId}, ${p.stage}${p.possession ? ` (possession ${p.possession})` : ""}. Available units: ${units}.${amen}${broch}${fplans}`;
      })
      .join("\n");
  } catch {
    return null;
  }
}

export type PropertyCard = {
  id: string;
  name: string;
  developer: string;
  locality: string;
  city: string;
  bhk: string;
  facing: string;
  priceMin: number;
  priceMax: number;
  distanceToStationM: number;
  reraId: string;
  unitCount: number;
};

/**
 * Find which real properties HouseX AI referenced in its reply, so the UI can render
 * visual cards. Matches by property name appearing in the text.
 */
export async function getMentionedProperties(text: string): Promise<PropertyCard[]> {
  try {
    const all = await prisma.property.findMany({ where: { status: "Live" }, include: { _count: { select: { units: true } } } });
    const low = text.toLowerCase();
    // prefer longer names first so "Greenvalley Phase 2" wins over "Greenvalley"
    const matched = all
      .filter((p) => low.includes(p.name.toLowerCase()))
      .sort((a, b) => b.name.length - a.name.length);
    // dedupe overlapping names (drop a match whose name is contained in an already-picked one)
    const picked: typeof matched = [];
    for (const p of matched) {
      if (!picked.some((q) => q.name.toLowerCase().includes(p.name.toLowerCase()))) picked.push(p);
    }
    return picked.slice(0, 3).map((p) => ({
      id: p.id, name: p.name, developer: p.developer, locality: p.locality, city: p.city,
      bhk: p.bhk, facing: p.facing, priceMin: p.priceMin, priceMax: p.priceMax,
      distanceToStationM: p.distanceToStationM, reraId: p.reraId, unitCount: p._count.units,
    }));
  } catch {
    return [];
  }
}

/**
 * Persist a chat turn: ensure a conversation (and its lead) exist, then append
 * the user + HouseX AI messages. Best-effort — never throws into the request path.
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
