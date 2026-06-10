import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The buyer chat polls this for offers in their conversation.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) return Response.json({ offers: [] });
  try {
    const offers = await prisma.offer.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true, propertyName: true, propertyId: true, listPriceLakh: true, offerPriceLakh: true,
        note: true, validUntil: true, status: true, counterPriceLakh: true, updatedAt: true,
      },
    });
    return Response.json({ offers });
  } catch {
    return Response.json({ offers: [] });
  }
}
