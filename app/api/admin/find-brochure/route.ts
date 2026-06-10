import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.LISTING_MODEL || "claude-opus-4-8";

const SYSTEM = `You research Indian real-estate projects on the web to help an operator enrich a listing on HouseX.

Your job: find the DEVELOPER'S OFFICIAL page for the given project (strongly prefer the developer's own website over property portals or brokers). Use web search and then fetch the most promising official page.

Then output ONLY a JSON object with these keys:
- "projectUrl": the official project page URL you trust most (or "").
- "brochureUrl": a DIRECT link to the project's brochure PDF if you can find one (ends in .pdf or clearly serves a PDF) (or "").
- "imageUrls": an array (max 6) of DIRECT image file URLs (https://….jpg/.jpeg/.png/.webp) showing the building or flat renders/photos from the official page. Real, direct image URLs only — no logos, icons, maps, or page URLs.
- "summary": one or two short sentences on what you found and from where.
- "confidence": "high" | "medium" | "low" — how sure you are this is the correct, official project.

RULES:
- Be honest. If you cannot confidently find the official project, return empty fields with "confidence":"low" and say so in the summary.
- NEVER invent or guess URLs. Only return URLs you actually saw.
- Output ONLY the JSON object, nothing else.`;

function extractJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return Response.json({ error: "AI isn't connected — add ANTHROPIC_API_KEY to enable web search." }, { status: 503 });

  let name = "", developer = "", locality = "", city = "";
  try {
    const b = await req.json();
    name = String(b?.name || "").trim();
    developer = String(b?.developer || "").trim();
    locality = String(b?.locality || "").trim();
    city = String(b?.city || "").trim();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (!name) return Response.json({ error: "Need a project name to search for." }, { status: 400 });

  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Project: ${name}\nDeveloper: ${developer || "(unknown)"}\nLocation: ${[locality, city].filter(Boolean).join(", ")}\n\nFind the official project page, a brochure PDF, and a few real photo URLs.`,
    },
  ];

  try {
    let response: Anthropic.Message | null = null;
    // Server-side web tools run an agentic loop; resume on pause_turn (bounded).
    for (let i = 0; i < 4; i++) {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 5 },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5 },
        ],
        messages,
      });
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }
      break;
    }

    const text = (response?.content ?? [])
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const parsed = extractJson(text);
    if (!parsed) return Response.json({ ok: true, result: { projectUrl: "", brochureUrl: "", imageUrls: [], summary: "Couldn't find a confident match online.", confidence: "low" } });

    // sanitize URLs we hand back to the UI
    const httpUrl = (v: unknown) => (typeof v === "string" && /^https?:\/\//i.test(v) ? v : "");
    const imageUrls = Array.isArray(parsed.imageUrls)
      ? parsed.imageUrls.map(httpUrl).filter((u) => u && /\.(jpe?g|png|webp)(\?|$)/i.test(u)).slice(0, 6)
      : [];

    return Response.json({
      ok: true,
      result: {
        projectUrl: httpUrl(parsed.projectUrl),
        brochureUrl: httpUrl(parsed.brochureUrl),
        imageUrls,
        summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 400) : "",
        confidence: ["high", "medium", "low"].includes(parsed.confidence as string) ? parsed.confidence : "low",
      },
    });
  } catch (err) {
    console.error("find-brochure error:", err);
    return Response.json({ error: "Web search failed — try again, or upload the brochure manually." }, { status: 502 });
  }
}
