import { prisma } from "@/lib/db";
import { getMember, canManageProperties, type Role } from "@/lib/devauth";

export const runtime = "nodejs";

type UnitIn = { floor?: unknown; priceLakh?: unknown; facing?: unknown; carpetSqft?: unknown };

export async function POST(req: Request) {
  const member = await getMember();
  if (!member) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (!canManageProperties(member.role as Role)) return Response.json({ error: "Your role can't add properties." }, { status: 403 });
  const dev = member.developer;

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

  const units = (Array.isArray(body.units) ? (body.units as UnitIn[]) : [])
    .map((u) => ({
      floor: n(u.floor),
      priceLakh: n(u.priceLakh),
      facing: s(u.facing, facing) || facing,
      carpetSqft: n(u.carpetSqft, carpetSqft) || carpetSqft,
      available: true,
    }))
    .filter((u) => u.priceLakh > 0);

  if (!name || !locality || !bhk) return Response.json({ error: "Fill in project name, locality and BHK." }, { status: 400 });
  if (units.length === 0) return Response.json({ error: "Add at least one unit with a price." }, { status: 400 });

  const priceMin = Math.min(...units.map((u) => u.priceLakh));
  const priceMax = Math.max(...units.map((u) => u.priceLakh));

  try {
    const prop = await prisma.property.create({
      data: {
        name, developer: dev.company, developerId: dev.id, city, locality, bhk, facing,
        carpetSqft, distanceToStationM, reraId, status, brochureUrl, amenities, priceMin, priceMax,
        units: { create: units },
      },
    });
    return Response.json({ ok: true, id: prop.id });
  } catch (err) {
    console.error("Create developer property error:", err);
    return Response.json({ error: "Could not save — is the database connected?" }, { status: 500 });
  }
}
