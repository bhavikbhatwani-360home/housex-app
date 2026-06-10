import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";
import EditForm from "./EditForm";

export const dynamic = "force-dynamic";

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
  const dev = await getDeveloper();
  if (!dev) return null;
  const { id } = await params;

  let property;
  try {
    property = await prisma.property.findFirst({
      where: { id, developerId: dev.id },
      include: { units: { orderBy: { floor: "asc" } } },
    });
  } catch {
    property = null;
  }
  if (!property) notFound();

  return (
    <EditForm
      initial={{
        id: property.id,
        name: property.name,
        city: property.city,
        locality: property.locality,
        bhk: property.bhk,
        facing: property.facing,
        carpetSqft: property.carpetSqft,
        distanceToStationM: property.distanceToStationM,
        reraId: property.reraId,
        status: property.status,
        amenities: property.amenities,
        brochureUrl: property.brochureUrl,
        description: property.description,
        possession: property.possession,
        videoUrl: property.videoUrl,
        images: property.images,
        units: property.units.map((u) => ({ floor: u.floor, priceLakh: u.priceLakh, facing: u.facing, carpetSqft: u.carpetSqft })),
      }}
    />
  );
}
