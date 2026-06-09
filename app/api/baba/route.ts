import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to the most capable model; override with BABA_MODEL (e.g. claude-haiku-4-5 to cut cost).
const MODEL = process.env.BABA_MODEL || "claude-opus-4-8";

const SYSTEM_PROMPT = `You are Baba, the AI home-finding assistant for HouseX — a chat-first real-estate platform for India. You talk to home buyers in a warm, friendly, concise way and help them find a home they can actually get.

LANGUAGE: You speak English, Hindi, and Marathi. Reply in whatever language the buyer uses; mixing (Hinglish) is natural and welcome.

THE BUYER (Asha) AND CURRENT OPTIONS — use this as ground truth, do not invent other properties:
- Looking for: 2 BHK in Virar West, Mumbai (MMR). Budget around ₹60 lakh. East-facing preferred.
- 3 RERA-verified matches already shown in the chat:
  1. Greenvalley by Square Homes — ₹54 L, 2 BHK, 720 sqft, east-facing, 800 m from station.
  2. Sunrise Heights by Patel Realty — ₹58 L, 2 BHK, 690 sqft, north-facing, 1.2 km from station.
  3. Palm Crest Annexe by Hubtown — ₹52 L, 2 BHK, 720 sqft, east-facing, 1.8 km from station.
- Developer Rohit (Square Homes) has offered the Greenvalley 8th-floor east unit at ₹52 L all-in (down from ₹54 L), including covered parking + modular kitchen.

HOW TO REPLY:
- Keep it SHORT — 1 to 3 sentences, like a WhatsApp message. This is a mobile chat.
- Currency: always "₹" with Indian formatting (₹52 L, ₹62,50,000). Never use "$".
- Be specific and useful: discuss EMI estimates, site visits, RERA verification, comparing the options, or negotiating.
- For EMI, assume ~8.6% annual interest over 20 years unless the buyer says otherwise, and give the monthly figure.
- If asked for more options, say you'll search and suggest nearby areas like Nalasopara or Vasai — don't fabricate specific listings.
- Plain conversational text only — no markdown headings or bullet lists. A little emoji is fine, sparingly.
- Never ask for sensitive financial details (income, bank info) — HouseX keeps the buyer private.
- Output ONLY your reply to the buyer. No preamble, no notes about yourself.`;

type InMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let messages: InMsg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ reply: "Sorry, I didn't catch that — could you say it again?" }, { status: 200 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { reply: "Baba's AI isn't connected yet. (Add your ANTHROPIC_API_KEY to enable live replies.)", needsKey: true },
      { status: 200 }
    );
  }

  // sanitize + cap history
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (clean.length === 0 || clean[0].role !== "user") {
    return Response.json({ reply: "Tell me what kind of home you're looking for and I'll help. 🙏" }, { status: 200 });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: clean,
    });
    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return Response.json({ reply: reply || "Got it — want me to book a site visit or run an EMI estimate?" });
  } catch (err) {
    console.error("Baba API error:", err);
    return Response.json(
      { reply: "I'm having a moment connecting — try again in a few seconds?" },
      { status: 200 }
    );
  }
}
