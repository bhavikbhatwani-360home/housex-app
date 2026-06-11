import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { normalizeStage } from "@/lib/stage";

export const runtime = "nodejs";

type UnitIn = { floor?: unknown; priceLakh?: unknown; listPriceLakh?: unknown; tag?: unknown; facing?: unknown; carpetSqft?: unknown; available?: unknown };

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
  const city = s(body.city, "Mumbai (MMR)");
  const locality = s(body.locality);
  const bhk = s(body.bhk);
  const facing = s(body.facing, "East");
  const carpetSqft = n(body.carpetSqft);
  const distanceToStationM = n(body.distanceToStationM);
  const reraId = s(body.reraId);
  const status = s(body.status, "Live");
  const brochureUrl = body.brochureUrl ? s(body.brochureUrl) : null;
  const amenities = Array.isArray(body.amenities) ? body.amenities.map((a) => String(a)).filter(Boolean) : [];
  const description = s(body.description) || null;
  const possession = s(body.possession) || null;
  const stage = normalizeStage(s(body.stage), possession);
  const videoUrl = s(body.videoUrl) || null;
  const images = Array.isArray(body.images) ? body.images.map((x) => String(x).trim()).filter(Boolean) : [];
  const floorPlans = Array.isArray(body.floorPlans) ? body.floorPlans.map((x) => String(x).trim()).filter(Boolean) : [];
  const nearby = Array.isArray(body.nearby) ? body.nearby.map((x) => String(x).trim()).filter(Boolean) : [];
  const totalTowers = n(body.totalTowers) > 0 ? Math.trunc(n(body.totalTowers)) : null;
  const totalUnits = n(body.totalUnits) > 0 ? Math.trunc(n(body.totalUnits)) : null;
  const projectArea = s(body.projectArea) || null;
  const totalFloors = s(body.totalFloors) || null;

  // on-behalf-of: link to a developer account so leads route to them
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
        // only keep an anchor price if it's actually higher than the offer
        listPriceLakh: list > priceLakh ? list : null,
        tag: s(u.tag) || null,
        facing: s(u.facing, facing) || facing,
        carpetSqft: n(u.carpetSqft, carpetSqft) || carpetSqft,
        available: u.available !== false,
      };
    })
    .filter((u) => u.priceLakh > 0);

  if (!name || !locality || !bhk)
    return Response.json({ error: "Fill in project name, locality and BHK." }, { status: 400 });
  if (units.length === 0)
    return Response.json({ error: "Add at least one unit with a price." }, { status: 400 });

  const priceMin = Math.min(...units.map((u) => u.priceLakh));
  const priceMax = Math.max(...units.map((u) => u.priceLakh));

  try {
    const prop = await prisma.property.create({
      data: {
        name, developer: developerName, developerId, city, locality, bhk, facing, carpetSqft, distanceToStationM,
        reraId, status, stage, brochureUrl, amenities, priceMin, priceMax,
        description, possession, videoUrl, images, floorPlans, nearby, totalTowers, totalUnits, projectArea, totalFloors,
        offerNote: s(body.offerNote) || null,
        units: { create: units },
      },
    });
    return Response.json({ ok: true, id: prop.id });
  } catch (err) {
    console.error("Create property error:", err);
    return Response.json({ error: "Could not save — is the database connected?" }, { status: 500 });
  }
}
