import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bulk-create RERA "skeleton" listings from a CSV the team pulled for one area.
// Each row becomes a Pending property with placeholder price (0) — the brochure
// agent + manager enrich and approve it later. Deduped by RERA registration no.
type RowIn = { name?: unknown; developer?: unknown; city?: unknown; locality?: unknown; reraId?: unknown; possession?: unknown };

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let rows: RowIn[];
  try {
    const body = await req.json();
    rows = Array.isArray(body?.rows) ? body.rows : [];
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (rows.length === 0) return Response.json({ error: "No rows to import." }, { status: 400 });
  if (rows.length > 5000) return Response.json({ error: "Too many rows — import up to 5,000 at a time." }, { status: 400 });

  const s = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

  // Clean + require a name; keep the RERA id for dedupe.
  const clean = rows
    .map((r) => ({
      name: s(r.name),
      developer: s(r.developer) || "Unknown developer",
      city: s(r.city) || "Mumbai (MMR)",
      locality: s(r.locality),
      reraId: s(r.reraId),
      possession: s(r.possession),
    }))
    .filter((r) => r.name);

  if (clean.length === 0)
    return Response.json({ error: "No usable rows — make sure a Project name column is mapped." }, { status: 400 });

  // Dedupe within this batch and against what's already in the DB (by RERA id).
  const seen = new Set<string>();
  const batchDeduped = clean.filter((r) => {
    if (!r.reraId) return true; // no id → can't dedupe, allow it
    if (seen.has(r.reraId)) return false;
    seen.add(r.reraId);
    return true;
  });

  const incomingIds = batchDeduped.map((r) => r.reraId).filter(Boolean);
  let existingIds = new Set<string>();
  try {
    const found = await prisma.property.findMany({
      where: { reraId: { in: incomingIds } },
      select: { reraId: true },
    });
    existingIds = new Set(found.map((p) => p.reraId));
  } catch {
    return Response.json({ error: "Could not reach the database." }, { status: 500 });
  }

  const toCreate = batchDeduped.filter((r) => !(r.reraId && existingIds.has(r.reraId)));
  const skipped = clean.length - toCreate.length;

  try {
    if (toCreate.length) {
      await prisma.property.createMany({
        data: toCreate.map((r) => ({
          name: r.name,
          developer: r.developer,
          city: r.city,
          locality: r.locality,
          bhk: "", // unknown until enriched
          priceMin: 0,
          priceMax: 0,
          carpetSqft: 0,
          facing: "East",
          distanceToStationM: 0,
          reraId: r.reraId,
          possession: r.possession || null,
          status: "Pending", // never auto-live
        })),
      });
    }
    return Response.json({ ok: true, created: toCreate.length, skipped, total: clean.length });
  } catch (err) {
    console.error("RERA import error:", err);
    return Response.json({ error: "Could not save the imported projects." }, { status: 500 });
  }
}
