import Anthropic from "@anthropic-ai/sdk";
import { getInventoryContext, persistTurn, getMentionedProperties } from "@/lib/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to the most capable model; override with BABA_MODEL (e.g. claude-haiku-4-5 to cut cost).
const MODEL = process.env.BABA_MODEL || "claude-opus-4-8";

// Used only if the property database isn't connected yet.
const FALLBACK_INVENTORY = `- Greenvalley by Square Homes — Virar West. 2 BHK, ₹52–58L, east-facing, 800 m from station. Units: floor 1 = ₹54L; floor 8 = ₹52L (offer unit, incl. covered parking + modular kitchen).
- Sunrise Heights by Patel Realty — Virar West. 2 BHK, ₹56–62L, north-facing, 1.2 km from station.
- Palm Crest Annexe by Hubtown — Virar East. 2 BHK, ₹50–56L, east-facing, 1.8 km from station.`;

function buildSystemPrompt(inventory: string) {
  return `You are Baba, the AI home-finding assistant for HouseX — a chat-first real-estate platform for India. You talk to home buyers in a warm, friendly, concise way and help them find a home they can actually get.

LANGUAGE: You speak English, Hindi, and Marathi. Reply in whatever language the buyer uses; mixing (Hinglish) is natural and welcome.

CURRENT LIVE INVENTORY — this is real and up to date. Answer ONLY from these properties and their actual units. Quote exact floors and prices from this list; do NOT invent floors, prices, or projects that aren't here:
${inventory}

HOW TO REPLY:
- Keep it SHORT — 1 to 3 sentences for simple questions; a tight list only when comparing options. This is a mobile chat.
- Currency: always "₹" with Indian formatting (₹52 L, ₹62,50,000). Never use "$".
- Be specific using the inventory above: quote real floor-wise prices, facing, distance, RERA, amenities. If a buyer asks about a floor, look it up in the unit list and give the actual price.
- For EMI, assume ~8.6% annual interest over 20 years unless told otherwise, and give the monthly figure.
- If asked for a brochure or floor plan: if the property shows "Brochure available", say you'll share it and that the developer will send the full brochure + floor plans when the visit is booked. Don't invent a link.
- If nothing in inventory fits, say so honestly and suggest the closest nearby options that ARE in the list.
- Plain conversational text only — no markdown headings. A little emoji is fine, sparingly.
- Never ask for sensitive financial details (income, bank info) — HouseX keeps the buyer private.
- Output ONLY your reply to the buyer.`;
}

type InMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let messages: InMsg[] = [];
  let conversationId: string | undefined;
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
    conversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;
  } catch {
    return Response.json({ reply: "Sorry, I didn't catch that — could you say it again?" }, { status: 200 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { reply: "Baba's AI isn't connected yet. (Add your ANTHROPIC_API_KEY to enable live replies.)", needsKey: true },
      { status: 200 }
    );
  }

  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (clean.length === 0 || clean[0].role !== "user") {
    return Response.json({ reply: "Tell me what kind of home you're looking for and I'll help. 🙏" }, { status: 200 });
  }

  const inventory = (await getInventoryContext()) ?? FALLBACK_INVENTORY;

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: buildSystemPrompt(inventory),
      messages: clean,
    });
    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const finalReply = reply || "Got it — want me to book a site visit or run an EMI estimate?";

    // attach visual cards for any real properties Baba referenced
    const properties = await getMentionedProperties(finalReply);

    // persist the turn (best-effort)
    const lastUser = [...clean].reverse().find((m) => m.role === "user");
    await persistTurn(conversationId, lastUser?.content ?? "", finalReply);

    return Response.json({ reply: finalReply, properties });
  } catch (err) {
    console.error("Baba API error:", err);
    return Response.json({ reply: "I'm having a moment connecting — try again in a few seconds?" }, { status: 200 });
  }
}
