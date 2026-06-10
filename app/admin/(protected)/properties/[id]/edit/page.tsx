import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import NewPropertyForm from "../../new/NewPropertyForm";

export const dynamic = "force-dynamic";

const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];
const numStr = (n: number | null | undefined) => (n && n > 0 ? String(n) : "");

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [p, developers] = await Promise.all([
    prisma.property
      .findUnique({ where: { id }, include: { units: { orderBy: { floor: "asc" } } } })
      .catch(() => null),
    prisma.developer.findMany({ select: { id: true, company: true }, orderBy: { company: "asc" } }).catch(() => []),
  ]);

  if (!p) notFound();

  const initial = {
    name: p.name,
    developer: p.developer,
    city: p.city,
    locality: p.locality,
    bhk: BHKS.includes(p.bhk) ? p.bhk : "2 BHK",
    facing: p.facing || "East",
    carpetSqft: numStr(p.carpetSqft),
    distanceToStationM: numStr(p.distanceToStationM),
    reraId: p.reraId,
    status: p.status,
    amenities: p.amenities.join(", "),
    brochureUrl: p.brochureUrl ?? "",
    videoUrl: p.videoUrl ?? "",
    possession: p.possession ?? "",
    description: p.description ?? "",
    images: p.images.join("\n"),
    totalTowers: numStr(p.totalTowers),
    totalUnits: numStr(p.totalUnits),
    projectArea: p.projectArea ?? "",
    totalFloors: p.totalFloors ?? "",
    floorPlans: p.floorPlans.join("\n"),
    nearby: p.nearby.join("\n"),
  };

  const initialUnits = p.units.map((u) => ({
    floor: String(u.floor),
    priceLakh: String(u.priceLakh),
    facing: u.facing,
    carpetSqft: String(u.carpetSqft),
  }));

  return (
    <NewPropertyForm
      developers={developers}
      initial={initial}
      initialUnits={initialUnits}
      propertyId={p.id}
      initialDeveloperId={p.developerId ?? ""}
    />
  );
}
