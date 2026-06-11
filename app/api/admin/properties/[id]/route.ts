import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { normalizeStage } from "@/lib/stage";

export const runtime = "nodejs";

const STATUSES = ["Live", "Pending", "Draft"];

type UnitIn = { floor?: unknown; priceLakh?: unknown; listPriceLakh?: unknown; tag?: unknown; facing?: unknown; carpetSqft?: unknown };

// PATCH — quick status change (manager approval). Guards against going Live
// with no real price, which would show "₹0 L" to buyers.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let status: string;
  try {
    const body = await req.json();
    status = typeof body?.status === "string" ? body.status : "";
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (!STATUSES.includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 });

  if (status === "Live") {
    const p = await prisma.property.findUnique({ where: { id }, select: { priceMin: true } }).catch(() => null);
    if (!p) return Response.json({ error: "Not found." }, { status: 404 });
    if (!p.priceMin || p.priceMin <= 0)
      return Response.json({ error: "Add a price before approving this listing." }, { status: 400 });
  }

  try {
    await prisma.property.update({ where: { id }, data: { status } });
    return Response.json({ ok: true, status });
  } catch (err) {
    console.error("Update property status error:", err);
    return Response.json({ error: "Could not update — is the database connected?" }, { status: 500 });
  }
}

// PUT — full edit (used to enrich a RERA skeleton via the admin edit page).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const s = (v: unknown, d = "") => (typeof v === "string" ? v.trim() : d);
  const n = (v: unknown, d = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : d;
  };

  const name = s(body.name);
  const locality = s(body.locality);
  const bhk = s(body.bhk);
  if (!name || !locality) return Response.json({ error: "Fill in project name and locality." }, { status: 400 });

  const facing = s(body.facing, "East");
  const carpetSqft = n(body.carpetSqft);
  const distanceToStationM = n(body.distanceToStationM);
  const status = STATUSES.includes(s(body.status)) ? s(body.status) : "Pending";
  const amenities = Array.isArray(body.amenities) ? body.amenities.map((a) => String(a)).filter(Boolean) : [];
  const images = Array.isArray(body.images) ? body.images.map((x) => String(x).trim()).filter(Boolean) : [];
  const floorPlans = Array.isArray(body.floorPlans) ? body.floorPlans.map((x) => String(x).trim()).filter(Boolean) : [];
  const nearby = Array.isArray(body.nearby) ? body.nearby.map((x) => String(x).trim()).filter(Boolean) : [];

  // developer account link (may be empty for an unclaimed/seeded listing)
  const developerId = s(body.developerId) || null;
  let developerName = s(body.developer);
  if (developerId) {
    const acc = await prisma.developer.findUnique({ where: { id: developerId }, select: { company: true } }).catch(() => null);
    if (!acc) return Response.json({ error: "Selected developer account not found." }, { status: 400 });
    developerName = acc.company;
  }
  if (!developerName) return Response.json({ error: "Pick a developer account or type a developer name." }, { status: 400 });

  const units = (Array.isArray(body.units) ? (body.units as UnitIn[]) : [])
    .map((u) => {
      const priceLakh = n(u.priceLakh);
      const list = n(u.listPriceLakh);
      return {
        floor: n(u.floor),
        priceLakh,
        listPriceLakh: list > priceLakh ? list : null,
        tag: s(u.tag) || null,
        facing: s(u.facing, facing) || facing,
        carpetSqft: n(u.carpetSqft, carpetSqft) || carpetSqft,
        available: true,
      };
    })
    .filter((u) => u.priceLakh > 0);

  // A listing with no priced units stays a skeleton (price 0). It cannot go Live
  // (guarded above + in PATCH) until a real price is added.
  const priceMin = units.length ? Math.min(...units.map((u) => u.priceLakh)) : 0;
  const priceMax = units.length ? Math.max(...units.map((u) => u.priceLakh)) : 0;
  if (status === "Live" && priceMin <= 0)
    return Response.json({ error: "Add at least one unit with a price before publishing." }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.unit.deleteMany({ where: { propertyId: id } }),
      prisma.property.update({
        where: { id },
        data: {
          name, developer: developerName, developerId, locality, bhk, facing, carpetSqft, distanceToStationM,
          reraId: s(body.reraId), status, brochureUrl: s(body.brochureUrl) || null, amenities, priceMin, priceMax,
          description: s(body.description) || null, possession: s(body.possession) || null, videoUrl: s(body.videoUrl) || null,
          stage: normalizeStage(s(body.stage), s(body.possession)),
          images, floorPlans, nearby,
          totalTowers: n(body.totalTowers) > 0 ? Math.trunc(n(body.totalTowers)) : null,
          totalUnits: n(body.totalUnits) > 0 ? Math.trunc(n(body.totalUnits)) : null,
          projectArea: s(body.projectArea) || null,
          totalFloors: s(body.totalFloors) || null,
          offerNote: s(body.offerNote) || null,
          city: s(body.city, "Mumbai (MMR)"),
          ...(units.length ? { units: { create: units } } : {}),
        },
      }),
    ]);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("Update property error:", err);
    return Response.json({ error: "Could not save — is the database connected?" }, { status: 500 });
  }
}
