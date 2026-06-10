import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type UnitSeed = { floor: number; priceLakh: number; facing: string; carpetSqft: number; available?: boolean };
type PropSeed = {
  name: string; developer: string; city: string; locality: string; bhk: string;
  priceMin: number; priceMax: number; carpetSqft: number; facing: string;
  distanceToStationM: number; reraId: string; status?: string;
  amenities: string[]; brochureUrl?: string; units: UnitSeed[];
  description?: string; possession?: string; nearby?: string[];
  totalTowers?: number; totalUnits?: number; projectArea?: string; totalFloors?: string;
};

// Realistic MMR (Mumbai metropolitan region) inventory for the pilot.
// Developers replace/extend this via the add-property flow later.
const PROPERTIES: PropSeed[] = [
  {
    name: "Greenvalley", developer: "Square Homes", city: "Mumbai (MMR)", locality: "Virar West",
    bhk: "2 BHK", priceMin: 52, priceMax: 58, carpetSqft: 720, facing: "East",
    distanceToStationM: 800, reraId: "P51700012345", amenities: ["Covered parking", "Modular kitchen", "Kids' play area", "Gym", "Gated society", "Clubhouse"],
    description: "A premium RERA-verified 2 BHK community in the heart of Virar West — just 800 m from the station, with east-facing homes, a clubhouse, and kid-friendly green spaces. Ready to move in.",
    possession: "Ready to move", totalTowers: 4, totalUnits: 320, projectArea: "3.2 acres", totalFloors: "G+11",
    nearby: ["School, DAV Public School, 600 m", "Hospital, Apex Multispeciality, 1.2 km", "Market, D-Mart, 800 m", "Station, Virar Station, 800 m", "Park, Central Garden, 300 m", "Mall, Maxus Mall, 2.5 km"],
    units: [
      { floor: 1, priceLakh: 54, facing: "East", carpetSqft: 720 },
      { floor: 3, priceLakh: 55, facing: "East", carpetSqft: 720 },
      { floor: 5, priceLakh: 56, facing: "North", carpetSqft: 700 },
      { floor: 8, priceLakh: 52, facing: "East", carpetSqft: 720 }, // the discounted offer unit
      { floor: 11, priceLakh: 58, facing: "East", carpetSqft: 740 },
    ],
  },
  {
    name: "Greenvalley Phase 2", developer: "Square Homes", city: "Mumbai (MMR)", locality: "Virar West",
    bhk: "3 BHK", priceMin: 74, priceMax: 88, carpetSqft: 1020, facing: "East",
    distanceToStationM: 850, reraId: "P51700012890", amenities: ["Covered parking", "Clubhouse", "Swimming pool", "Gym"],
    units: [
      { floor: 2, priceLakh: 74, facing: "East", carpetSqft: 1010 },
      { floor: 6, priceLakh: 80, facing: "West", carpetSqft: 1020 },
      { floor: 10, priceLakh: 88, facing: "East", carpetSqft: 1050 },
    ],
  },
  {
    name: "Sunrise Heights", developer: "Patel Realty", city: "Mumbai (MMR)", locality: "Virar West",
    bhk: "2 BHK", priceMin: 56, priceMax: 62, carpetSqft: 690, facing: "North",
    distanceToStationM: 1200, reraId: "P51700013111", amenities: ["Parking", "Gym", "Rainwater harvesting", "Clubhouse"],
    description: "Modern 2 BHK towers in Virar West with a rooftop clubhouse and landscaped gardens. Possession by end of 2026.",
    possession: "Dec 2026", totalTowers: 2, totalUnits: 180, projectArea: "1.8 acres", totalFloors: "G+7",
    nearby: ["School, Podar International, 900 m", "Hospital, Sanjeevani Hospital, 1.5 km", "Market, Reliance Fresh, 600 m", "Station, Virar Station, 1.2 km"],
    units: [
      { floor: 2, priceLakh: 56, facing: "North", carpetSqft: 690 },
      { floor: 4, priceLakh: 58, facing: "East", carpetSqft: 700 },
      { floor: 7, priceLakh: 62, facing: "East", carpetSqft: 710 },
    ],
  },
  {
    name: "Palm Crest Annexe", developer: "Hubtown", city: "Mumbai (MMR)", locality: "Virar East",
    bhk: "2 BHK", priceMin: 50, priceMax: 56, carpetSqft: 720, facing: "East",
    distanceToStationM: 1800, reraId: "P51700013455", amenities: ["Parking", "Garden", "Security"],
    units: [
      { floor: 1, priceLakh: 50, facing: "East", carpetSqft: 720 },
      { floor: 5, priceLakh: 53, facing: "South", carpetSqft: 710 },
      { floor: 9, priceLakh: 56, facing: "East", carpetSqft: 730 },
    ],
  },
  {
    name: "Riverside Vista", developer: "Mahalaxmi Group", city: "Mumbai (MMR)", locality: "Nalasopara West",
    bhk: "1 BHK", priceMin: 32, priceMax: 38, carpetSqft: 430, facing: "West",
    distanceToStationM: 600, reraId: "P51700013999", amenities: ["Lift", "Parking", "CCTV"],
    units: [
      { floor: 2, priceLakh: 32, facing: "West", carpetSqft: 430 },
      { floor: 4, priceLakh: 35, facing: "East", carpetSqft: 440 },
      { floor: 6, priceLakh: 38, facing: "East", carpetSqft: 450 },
    ],
  },
  {
    name: "Vasai Greens", developer: "Rustomjee", city: "Mumbai (MMR)", locality: "Vasai East",
    bhk: "2 BHK", priceMin: 48, priceMax: 54, carpetSqft: 680, facing: "East",
    distanceToStationM: 1500, reraId: "P51700014222", amenities: ["Clubhouse", "Garden", "Parking", "Kids' play area"],
    units: [
      { floor: 1, priceLakh: 48, facing: "East", carpetSqft: 680 },
      { floor: 3, priceLakh: 50, facing: "North", carpetSqft: 680 },
      { floor: 7, priceLakh: 54, facing: "East", carpetSqft: 700 },
    ],
  },
  {
    name: "Lake County", developer: "Poddar Housing", city: "Mumbai (MMR)", locality: "Mira Road",
    bhk: "2 BHK", priceMin: 62, priceMax: 70, carpetSqft: 700, facing: "East",
    distanceToStationM: 1100, reraId: "P51700014777", amenities: ["Swimming pool", "Gym", "Clubhouse", "Covered parking"],
    units: [
      { floor: 3, priceLakh: 62, facing: "East", carpetSqft: 700 },
      { floor: 6, priceLakh: 66, facing: "West", carpetSqft: 700 },
      { floor: 12, priceLakh: 70, facing: "East", carpetSqft: 720 },
    ],
  },
  {
    name: "Bhayandar Heights", developer: "Sai Developers", city: "Mumbai (MMR)", locality: "Bhayandar",
    bhk: "1 BHK", priceMin: 38, priceMax: 44, carpetSqft: 460, facing: "North",
    distanceToStationM: 900, reraId: "P51700015100", amenities: ["Lift", "Parking", "Security"],
    units: [
      { floor: 2, priceLakh: 38, facing: "North", carpetSqft: 460 },
      { floor: 5, priceLakh: 41, facing: "East", carpetSqft: 470 },
      { floor: 8, priceLakh: 44, facing: "East", carpetSqft: 480 },
    ],
  },
];

async function main() {
  console.log("Seeding properties…");
  for (const p of PROPERTIES) {
    const { units, ...data } = p;
    // idempotent: clear existing same-named property then recreate
    const existing = await prisma.property.findFirst({ where: { name: p.name, developer: p.developer } });
    if (existing) {
      await prisma.unit.deleteMany({ where: { propertyId: existing.id } });
      await prisma.property.update({
        where: { id: existing.id },
        data: { ...data, units: { create: units } },
      });
    } else {
      await prisma.property.create({ data: { ...data, units: { create: units } } });
    }
    console.log(`  ✓ ${p.name} (${units.length} units)`);
  }
  const count = await prisma.property.count();
  console.log(`Done. ${count} properties in inventory.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
