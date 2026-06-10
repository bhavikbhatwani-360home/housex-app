import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://housex-app.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/chat`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${APP_URL}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const props = await prisma.property.findMany({
      where: { status: "Live" },
      select: { id: true, createdAt: true },
      take: 1000,
    });
    return [
      ...staticPages,
      ...props.map((p) => ({
        url: `${APP_URL}/property/${p.id}`,
        lastModified: p.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticPages;
  }
}
