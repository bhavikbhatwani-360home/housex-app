import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { normalizeStage } from "@/lib/stage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bulk-create listings from a CSV the team pulled for one area. Skeleton fields
// (name/developer/locality/RERA) always; rich fields (price/BHK/carpet/towers/
// floors) when the CSV has them. Everything imports as Pending — a manager
// verifies the price and approves before it goes Live. Deduped by RERA number.
type RowIn = Record<string, unknown>;

const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];

// "₹33.99 Lacs" -> 34 ; "₹1.10 Cr" -> 110 ; "1.6 crore" -> 160 ; "" -> 0
function parseMoneyLakh(v: unknown): number {
  const str = String(v ?? "").toLowerCase();
  const m = str.match(/([\d.,]+)/);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(num)) return 0;
  const isCr = /cr|crore/.test(str);
  return Math.round(isCr ? num * 100 : num);
}

// "296-770 sqft" -> 296 ; "720" -> 720 ; "G+23" -> 23
function firstInt(v: unknown): number {
  const m = String(v ?? "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// "1 RK, 1 BHK, 2 BHK" -> "2 BHK" (a representative config; manager can adjust)
function normalizeBhk(v: unknown): string {
  const str = String(v ?? "");
  if (/3\s*\+|4\s*BHK|3\.5/.test(str)) return "3+ BHK";
  if (/2\s*BHK/.test(str)) return "2 BHK";
  if (/1\s*BHK/.test(str)) return "1 BHK";
  if (/3\s*BHK/.test(str)) return "3 BHK";
  return "";
}

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

  // A real MahaRERA number looks like a letter + digits (P99000053022).
  // Junk like "Not Registered" / "Applied" becomes blank (so it never dedupes).
  const cleanRera = (v: unknown) => {
    const raw = s(v);
    return /^[A-Za-z]\d{5,}/.test(raw) ? raw : "";
  };

  const clean = rows
    .map((r) => {
      const priceMin = parseMoneyLakh(r.priceMin);
      const priceMax = parseMoneyLakh(r.priceMax) || priceMin;
      return {
        name: s(r.name),
        developer: s(r.developer) || "Unknown developer",
        city: s(r.city) || "Mumbai (MMR)",
        locality: s(r.locality),
        reraId: cleanRera(r.reraId),
        possession: s(r.possession),
        priceMin,
        priceMax: Math.max(priceMin, priceMax),
        bhk: normalizeBhk(r.bhk),
        carpetSqft: firstInt(r.carpetSqft),
        totalTowers: firstInt(r.towers),
        totalFloors: s(r.floors),
      };
    })
    .filter((r) => r.name);

  if (clean.length === 0)
    return Response.json({ error: "No usable rows — make sure a Project name column is mapped." }, { status: 400 });

  // Dedupe within the batch and against the DB (by RERA id).
  const seen = new Set<string>();
  const batch = clean.filter((r) => {
    if (!r.reraId) return true;
    if (seen.has(r.reraId)) return false;
    seen.add(r.reraId);
    return true;
  });

  const incomingIds = batch.map((r) => r.reraId).filter(Boolean);
  let existingByRera = new Map<string, { id: string; priceMin: number; status: string }>();
  try {
    const found = await prisma.property.findMany({
      where: { reraId: { in: incomingIds } },
      select: { id: true, reraId: true, priceMin: true, status: true },
    });
    existingByRera = new Map(found.map((p) => [p.reraId, { id: p.id, priceMin: p.priceMin, status: p.status }]));
  } catch {
    return Response.json({ error: "Could not reach the database." }, { status: 500 });
  }

  // Split into new projects vs. existing ones to enrich. We only update an
  // existing listing if it's still a price-less Pending skeleton AND this row
  // brings a price — so a re-import fills in earlier imports without ever
  // clobbering a listing a manager has already priced, enriched, or approved.
  const toCreate: typeof batch = [];
  const toUpdate: { id: string; r: (typeof batch)[number] }[] = [];
  for (const r of batch) {
    const ex = r.reraId ? existingByRera.get(r.reraId) : undefined;
    if (!ex) toCreate.push(r);
    else if (ex.priceMin === 0 && ex.status === "Pending" && r.priceMin > 0) toUpdate.push({ id: ex.id, r });
    // else: leave the existing listing untouched
  }
  const created = toCreate.length;
  const updated = toUpdate.length;
  const skipped = clean.length - created - updated;
  const withPrice = toCreate.filter((r) => r.priceMin > 0).length + updated;

  try {
    if (toCreate.length) {
      await prisma.property.createMany({
        data: toCreate.map((r) => ({
          name: r.name,
          developer: r.developer,
          city: r.city,
          locality: r.locality,
          bhk: BHKS.includes(r.bhk) ? r.bhk : "",
          priceMin: r.priceMin,
          priceMax: r.priceMax,
          carpetSqft: r.carpetSqft,
          facing: "East",
          distanceToStationM: 0,
          reraId: r.reraId,
          possession: r.possession || null,
          stage: normalizeStage(undefined, r.possession),
          totalTowers: r.totalTowers > 0 ? r.totalTowers : null,
          totalFloors: r.totalFloors || null,
          status: "Pending", // never auto-live — manager verifies price first
        })),
      });
    }
    if (toUpdate.length) {
      await prisma.$transaction(
        toUpdate.map(({ id, r }) =>
          prisma.property.update({
            where: { id },
            data: {
              priceMin: r.priceMin,
              priceMax: r.priceMax,
              ...(BHKS.includes(r.bhk) ? { bhk: r.bhk } : {}),
              ...(r.carpetSqft > 0 ? { carpetSqft: r.carpetSqft } : {}),
              ...(r.totalTowers > 0 ? { totalTowers: r.totalTowers } : {}),
              ...(r.totalFloors ? { totalFloors: r.totalFloors } : {}),
              ...(r.possession ? { possession: r.possession } : {}),
              ...(r.locality ? { locality: r.locality } : {}),
            },
          })
        )
      );
    }
    return Response.json({ ok: true, created, updated, skipped, withPrice, total: clean.length });
  } catch (err) {
    console.error("RERA import error:", err);
    return Response.json({ error: "Could not save the imported projects." }, { status: 500 });
  }
}
