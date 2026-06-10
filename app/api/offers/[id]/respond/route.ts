import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Buyer responds to an offer: accept / decline / counter.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const action = typeof body.action === "string" ? body.action : "";
  const counterPriceLakh = Number(body.counterPriceLakh);

  if (!["accept", "decline", "counter"].includes(action)) {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }
  if (action === "counter" && (!Number.isFinite(counterPriceLakh) || counterPriceLakh <= 0)) {
    return Response.json({ error: "Enter a valid counter price." }, { status: 400 });
  }

  try {
    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) return Response.json({ error: "Offer not found." }, { status: 404 });
    if (offer.status !== "Pending") return Response.json({ error: "This offer was already answered." }, { status: 409 });

    const status = action === "accept" ? "Accepted" : action === "decline" ? "Declined" : "Countered";
    await prisma.offer.update({
      where: { id },
      data: { status, ...(action === "counter" ? { counterPriceLakh: Math.trunc(counterPriceLakh) } : {}) },
    });

    // reflect on the lead
    if (offer.leadId) {
      const leadStatus = action === "accept" ? "Offer accepted" : action === "counter" ? "Countered" : "Offer declined";
      await prisma.lead.update({ where: { id: offer.leadId }, data: { status: leadStatus } }).catch(() => {});
    }

    return Response.json({ ok: true, status });
  } catch (err) {
    console.error("Respond offer error:", err);
    return Response.json({ error: "Could not submit your response." }, { status: 500 });
  }
}
