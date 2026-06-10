import { prisma } from "@/lib/db";
import NewPropertyForm from "./NewPropertyForm";

export const dynamic = "force-dynamic";

export default async function AdminNewProperty() {
  const developers = await prisma.developer
    .findMany({ select: { id: true, company: true }, orderBy: { company: "asc" } })
    .catch(() => []);

  return <NewPropertyForm developers={developers} />;
}
