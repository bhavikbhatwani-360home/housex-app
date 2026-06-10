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
  return `You are HouseX AI, the AI home-finding assistant for HouseX — a chat-first real-estate platform for India. You talk to home buyers in a warm, friendly, concise way and help them find a home they can actually get.

LANGUAGE: You speak English, Hindi, and Marathi. Reply in whatever language the buyer uses; mixing (Hinglish) is natural and welcome.

CURRENT LIVE INVENTORY — this is real and up to date. Answer ONLY from these properties and their actual units. Quote exact floors and prices from this list; do NOT invent floors, prices, or projects that aren't here:
${inventory}

HOW TO REPLY:
- Keep it SHORT — 1 to 3 sentences for simple questions; a tight list only when comparing options. This is a mobile chat.
- Currency: always "₹" with Indian formatting (₹52 L, ₹62,50,000). Never use "$".
- Be specific using the inventory above: quote real floor-wise prices, facing, distance, RERA, amenities. If a buyer asks about a floor, look it up in the unit list and give the actual price.
- If the buyer's request is vague (no budget, area, or BHK), ask ONE short clarifying question — the single most useful one — instead of dumping options.
- ALWAYS move the conversation one step forward: after answering, suggest the natural next step (see a matching home, compare two options, check EMI, or book a site visit). One suggestion, not a menu.
- For EMI, assume ~8.6% annual interest over 20 years unless told otherwise, and give the monthly figure.
- If asked for a brochure or floor plan: if the property shows "Brochure available", say you'll share it and that the developer will send the full brochure + floor plans when the visit is booked. Don't invent a link.
- MATCH THE BUYER'S CONFIG FIRST. If the buyer asks for a specific BHK (e.g. 1 BHK) and their exact locality has none, scan the ENTIRE inventory for that SAME BHK in any locality and offer the nearest ones — name the project, locality, price, and roughly how far it is from where they asked. Only suggest a different BHK as a secondary fallback, never as the first answer.
- If genuinely nothing in inventory fits even after widening the area, say so honestly and offer to alert them when a matching listing comes up.
- Plain conversational text only — no markdown headings. A little emoji is fine, sparingly.
- Never ask for sensitive financial details (income, bank info) — HouseX keeps the buyer private.
- Output ONLY your reply to the buyer.`;
}

type InMsg = { role: "user" | "assistant"; content: string };

// ── simple in-memory rate limit (per serverless instance) ──
// Protects the Anthropic spend from abuse: 15 msgs / 5 min per IP, 300 / hour globally.
const ipHits = new Map<string, number[]>();
let globalHits: number[] = [];
const IP_LIMIT = 15, IP_WINDOW = 5 * 60_000;
const GLOBAL_LIMIT = 300, GLOBAL_WINDOW = 60 * 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  globalHits = globalHits.filter((t) => now - t < GLOBAL_WINDOW);
  if (globalHits.length >= GLOBAL_LIMIT) return true;
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < IP_WINDOW);
  if (hits.length >= IP_LIMIT) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  globalHits.push(now);
  if (ipHits.size > 5000) ipHits.clear(); // keep memory bounded
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) {
    return Response.json(
      { reply: "I'm getting a lot of messages right now 🙏 Give me a minute and try again." },
      { status: 200 }
    );
  }

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
      { reply: "HouseX AI isn't connected yet. (Add your ANTHROPIC_API_KEY to enable live replies.)", needsKey: true },
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

  // Stream the reply as NDJSON lines so the UI can render words as they arrive.
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(inventory),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: clean,
  });

  const encoder = new TextEncoder();
  const cid = conversationId;
  const lastUser = [...clean].reverse().find((m) => m.role === "user");

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            emit({ type: "delta", text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        const reply = final.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim() || "Got it — want me to book a site visit or run an EMI estimate?";

        // attach visual cards for any real properties HouseX AI referenced
        const properties = await getMentionedProperties(reply);
        emit({ type: "done", properties });

        // persist the turn (best-effort)
        await persistTurn(cid, lastUser?.content ?? "", reply);
      } catch (err) {
        console.error("HouseX AI API error:", err);
        emit({ type: "error", message: "I'm having a moment connecting — try again in a few seconds?" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
