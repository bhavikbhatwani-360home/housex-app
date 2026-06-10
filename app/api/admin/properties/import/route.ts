import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

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
  let existingIds = new Set<string>();
  try {
    const found = await prisma.property.findMany({ where: { reraId: { in: incomingIds } }, select: { reraId: true } });
    existingIds = new Set(found.map((p) => p.reraId));
  } catch {
    return Response.json({ error: "Could not reach the database." }, { status: 500 });
  }

  const toCreate = batch.filter((r) => !(r.reraId && existingIds.has(r.reraId)));
  const skipped = clean.length - toCreate.length;
  const withPrice = toCreate.filter((r) => r.priceMin > 0).length;

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
          totalTowers: r.totalTowers > 0 ? r.totalTowers : null,
          totalFloors: r.totalFloors || null,
          status: "Pending", // never auto-live — manager verifies price first
        })),
      });
    }
    return Response.json({ ok: true, created: toCreate.length, skipped, withPrice, total: clean.length });
  } catch (err) {
    console.error("RERA import error:", err);
    return Response.json({ error: "Could not save the imported projects." }, { status: 500 });
  }
}
