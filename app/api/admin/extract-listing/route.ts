import Anthropic from "@anthropic-ai/sdk";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vision-capable model; override with LISTING_MODEL if needed.
const MODEL = process.env.LISTING_MODEL || "claude-opus-4-8";

const MAX_IMAGES = 8;
const MAX_BYTES = 5 * 1024 * 1024; // ~5MB per image after base64 decode
const MAX_PDF_BYTES = 28 * 1024 * 1024; // Claude accepts PDFs up to ~32MB

type ImgIn = { media_type: string; data: string };

// Parse a data URL ("data:image/jpeg;base64,XXXX") into the parts Claude needs.
function parseDataUrl(s: unknown): ImgIn | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  const data = m[2];
  if ((data.length * 3) / 4 > MAX_BYTES) return null;
  return { media_type: m[1], data };
}

// Parse a base64 PDF data URL.
function parsePdf(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;
  if ((m[1].length * 3) / 4 > MAX_PDF_BYTES) return null;
  return m[1];
}

const SYSTEM = `You are HouseX's listing assistant. You read photos of Indian real-estate brochures, price lists, and project sheets, and extract the project details into structured data for a human manager to review.

RULES:
- Prices are in Indian Rupees. Convert everything to LAKHS as an integer (₹54,00,000 = 54; ₹1.2 Cr = 120). Never output dollars.
- Only extract what you can actually read in the images. If a field isn't visible, leave it empty ("" for text, 0 for numbers, [] for lists). NEVER guess or invent prices, RERA numbers, or unit data.
- "bhk" must be one of: "1 BHK", "2 BHK", "3 BHK", "3+ BHK". Pick the most common one if several.
- "facing" must be one of: "East", "West", "North", "South".
- For "units", read the COST SHEET / price list carefully and list EVERY floor/price row you can see — one entry per floor (or per unit type) with its exact carpet area and price. If different towers or facings have different prices, include each as its own row. If the brochure shows only a single price, output one unit. Do not invent rows you can't read.
- "nearby" entries are formatted "Category, Name, Distance" (e.g. "School, DAV Public School, 600 m").
- "imageKinds": classify EACH input image by its position (index, starting at 0) so we know which to show buyers. kind is one of: "render" (a photo/3D render of the building, flat, or amenities — good for the gallery), "floor_plan" (a unit or floor layout drawing), "cost_sheet" (a price list / payment plan — data only, not for the gallery), "location_map" (a map or connectivity chart), "other". Return one entry per image.
- "confidence" is your overall confidence the manager can trust this draft: "high", "medium", or "low".
- "notes" is a short message to the manager flagging anything to double-check — ALWAYS mention if prices or the RERA number were unclear or missing.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    developer: { type: "string" },
    city: { type: "string" },
    locality: { type: "string" },
    bhk: { type: "string", enum: ["1 BHK", "2 BHK", "3 BHK", "3+ BHK", ""] },
    facing: { type: "string", enum: ["East", "West", "North", "South", ""] },
    carpetSqft: { type: "integer" },
    distanceToStationM: { type: "integer" },
    reraId: { type: "string" },
    possession: { type: "string" },
    description: { type: "string" },
    amenities: { type: "array", items: { type: "string" } },
    nearby: { type: "array", items: { type: "string" } },
    totalTowers: { type: "integer" },
    totalUnits: { type: "integer" },
    projectArea: { type: "string" },
    totalFloors: { type: "string" },
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          floor: { type: "integer" },
          priceLakh: { type: "integer" },
          facing: { type: "string", enum: ["East", "West", "North", "South", ""] },
          carpetSqft: { type: "integer" },
        },
        required: ["floor", "priceLakh", "facing", "carpetSqft"],
      },
    },
    imageKinds: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          index: { type: "integer" },
          kind: { type: "string", enum: ["render", "floor_plan", "cost_sheet", "location_map", "other"] },
        },
        required: ["index", "kind"],
      },
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    notes: { type: "string" },
  },
  required: [
    "name", "developer", "city", "locality", "bhk", "facing", "carpetSqft",
    "distanceToStationM", "reraId", "possession", "description", "amenities",
    "nearby", "totalTowers", "totalUnits", "projectArea", "totalFloors",
    "units", "imageKinds", "confidence", "notes",
  ],
} as const;

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY)
    return Response.json({ error: "AI isn't connected — add ANTHROPIC_API_KEY to enable brochure auto-fill." }, { status: 503 });

  let images: ImgIn[] = [];
  let pdf: string | null = null;
  try {
    const body = await req.json();
    const raw = Array.isArray(body?.images) ? body.images : [];
    images = raw.slice(0, MAX_IMAGES).map(parseDataUrl).filter((x: ImgIn | null): x is ImgIn => x !== null);
    pdf = parsePdf(body?.pdf);
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (images.length === 0 && !pdf)
    return Response.json({ error: "Upload a brochure PDF, or clear photos (JPG/PNG, under 5MB each)." }, { status: 400 });

  const content: Anthropic.ContentBlockParam[] = pdf
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } },
        { type: "text", text: "Extract this project's listing details from the brochure PDF above into the required JSON. Read every page — especially the cost sheet / price list (list each floor/unit price). Prices in lakhs, only what you can read, flag anything unclear in notes. (imageKinds can be empty for a PDF.)" },
      ]
    : [
        ...images.map((img): Anthropic.ContentBlockParam => ({
          type: "image",
          source: { type: "base64", media_type: img.media_type as "image/jpeg", data: img.data },
        })),
        { type: "text", text: "Extract this project's listing details from the image(s) above into the required JSON. Remember: prices in lakhs, only what you can read, flag anything unclear in notes." },
      ];

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 3500,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const listing = JSON.parse(text);
    return Response.json({ ok: true, listing });
  } catch (err) {
    console.error("Listing extraction error:", err);
    return Response.json({ error: "Couldn't read the brochure — try clearer photos, or fill the form manually." }, { status: 502 });
  }
}
