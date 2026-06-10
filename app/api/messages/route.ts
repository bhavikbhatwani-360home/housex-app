import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The buyer chat reads this to resume a conversation and to receive developer replies.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  const role = url.searchParams.get("role"); // optional filter (e.g. "developer")
  const since = url.searchParams.get("since"); // optional ISO timestamp
  if (!conversationId) return Response.json({ messages: [] });

  try {
    const where: { conversationId: string; role?: string; createdAt?: { gt: Date } } = { conversationId };
    if (role) where.role = role;
    if (since) {
      const d = new Date(since);
      if (!isNaN(d.getTime())) where.createdAt = { gt: d };
    }
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 300,
      select: { id: true, role: true, content: true, senderName: true, createdAt: true },
    });
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}
