import { isAdmin } from "@/lib/admin";
import { storageConfigured, uploadDataUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Host listing media (photos, floor plans, brochure scans). With S3-compatible
// storage configured (Cloudflare R2 / AWS S3 / DigitalOcean Spaces), images are
// uploaded and we store short public URLs — keeps the DB lean and pages fast at
// scale. Without it, we pass the data URLs straight back so uploads still work
// (just stored inline). Either way the response says whether it hosted.

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let images: string[];
  try {
    const body = await req.json();
    images = Array.isArray(body?.images) ? body.images.map(String).slice(0, 16) : [];
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // No object storage configured → return inputs unchanged (persist inline).
  if (!storageConfigured) {
    return Response.json({ urls: images, hosted: false });
  }

  try {
    const urls = await Promise.all(
      images.map(async (img) => {
        // already a URL (re-saving an existing listing) → leave it as is
        if (!img.startsWith("data:")) return img;
        const hosted = await uploadDataUrl(img);
        return hosted ?? img;
      })
    );
    return Response.json({ urls, hosted: true });
  } catch (err) {
    console.error("Photo upload error:", err);
    // Fall back to inline data URLs rather than losing the photos.
    return Response.json({ urls: images, hosted: false });
  }
}
