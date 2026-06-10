import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getMember } from "@/lib/devauth";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getMember();
  if (!member) return Response.json({ error: "Please sign in." }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const text = (typeof body.text === "string" ? body.text : "").trim();
  if (!text) return Response.json({ error: "Empty message." }, { status: 400 });

  try {
    // the lead must belong to this developer
    const lead = await prisma.lead.findFirst({
      where: { id, developerId: member.developerId },
      include: { conversation: true },
    });
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    // ensure a conversation exists for this lead
    let conversationId = lead.conversation?.id;
    if (!conversationId) {
      const conv = await prisma.conversation.create({ data: { id: randomUUID(), leadId: lead.id } });
      conversationId = conv.id;
    }

    const senderName = `${member.name || "Sales team"} · ${member.developer.company}`;
    await prisma.message.create({
      data: { conversationId, role: "developer", content: text.slice(0, 4000), senderName },
    });

    // mark the lead as contacted (unless already further along)
    if (lead.status === "New") {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "Contacted" } });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Developer reply error:", err);
    return Response.json({ error: "Could not send." }, { status: 500 });
  }
}
