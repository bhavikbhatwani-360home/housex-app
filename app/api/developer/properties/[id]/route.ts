import { prisma } from "@/lib/db";
import { getMember, canManageProperties, type Role } from "@/lib/devauth";

export const runtime = "nodejs";

type UnitIn = { floor?: unknown; priceLakh?: unknown; facing?: unknown; carpetSqft?: unknown };

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember();
  if (!member) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!canManageProperties(member.role as Role)) return Response.json({ error: "Your role can't edit properties." }, { status: 403 });
  const dev = member.developer;
  const { id } = await params;

  // ownership check
  const existing = await prisma.property.findUnique({ where: { id }, select: { developerId: true } }).catch(() => null);
  if (!existing) return Response.json({ error: "Not found." }, { status: 404 });
  if (existing.developerId !== dev.id) return Response.json({ error: "Not your property." }, { status: 403 });

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
  const videoUrl = s(body.videoUrl) || null;
  const images = Array.isArray(body.images) ? body.images.map((x) => String(x).trim()).filter(Boolean) : [];
  const floorPlans = Array.isArray(body.floorPlans) ? body.floorPlans.map((x) => String(x).trim()).filter(Boolean) : [];
  const nearby = Array.isArray(body.nearby) ? body.nearby.map((x) => String(x).trim()).filter(Boolean) : [];
  const totalTowers = n(body.totalTowers) > 0 ? Math.trunc(n(body.totalTowers)) : null;
  const totalUnits = n(body.totalUnits) > 0 ? Math.trunc(n(body.totalUnits)) : null;
  const projectArea = s(body.projectArea) || null;
  const totalFloors = s(body.totalFloors) || null;

  const units = (Array.isArray(body.units) ? (body.units as UnitIn[]) : [])
    .map((u) => ({ floor: n(u.floor), priceLakh: n(u.priceLakh), facing: s(u.facing, facing) || facing, carpetSqft: n(u.carpetSqft, carpetSqft) || carpetSqft, available: true }))
    .filter((u) => u.priceLakh > 0);

  if (!name || !locality || !bhk) return Response.json({ error: "Fill in project name, locality and BHK." }, { status: 400 });
  if (units.length === 0) return Response.json({ error: "Add at least one unit with a price." }, { status: 400 });

  const priceMin = Math.min(...units.map((u) => u.priceLakh));
  const priceMax = Math.max(...units.map((u) => u.priceLakh));

  try {
    await prisma.$transaction([
      prisma.unit.deleteMany({ where: { propertyId: id } }),
      prisma.property.update({
        where: { id },
        data: { name, city, locality, bhk, facing, carpetSqft, distanceToStationM, reraId, status, brochureUrl, amenities, priceMin, priceMax, description, possession, videoUrl, images, floorPlans, nearby, totalTowers, totalUnits, projectArea, totalFloors, units: { create: units } },
      }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Update property error:", err);
    return Response.json({ error: "Could not save changes." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember();
  if (!member) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!canManageProperties(member.role as Role)) return Response.json({ error: "Your role can't delete properties." }, { status: 403 });
  const dev = member.developer;
  const { id } = await params;

  const existing = await prisma.property.findUnique({ where: { id }, select: { developerId: true } }).catch(() => null);
  if (!existing) return Response.json({ error: "Not found." }, { status: 404 });
  if (existing.developerId !== dev.id) return Response.json({ error: "Not your property." }, { status: 403 });

  try {
    // detach visits/bookings (keep their history), then delete the property (+units cascade)
    await prisma.$transaction([
      prisma.visit.updateMany({ where: { propertyId: id }, data: { propertyId: null } }),
      prisma.booking.updateMany({ where: { propertyId: id }, data: { propertyId: null } }),
      prisma.property.delete({ where: { id } }),
    ]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Delete property error:", err);
    return Response.json({ error: "Could not delete." }, { status: 500 });
  }
}
