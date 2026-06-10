import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Host brochure photos. With Vercel Blob configured (BLOB_READ_WRITE_TOKEN),
// images are uploaded and we store short public URLs — keeps the DB lean at
// scale. Without it, we pass the data URLs straight back so photos still work
// (just stored inline). Either way the property's images[] ends up with usable
// src values.
const dataUrlRe = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/;

export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let images: string[];
  try {
    const body = await req.json();
    images = Array.isArray(body?.images) ? body.images.map(String).slice(0, 16) : [];
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  // No blob storage configured → return inputs unchanged (data URLs persist inline).
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ urls: images, hosted: false });
  }

  try {
    const { put } = await import("@vercel/blob");
    const urls = await Promise.all(
      images.map(async (img) => {
        const m = img.match(dataUrlRe);
        if (!m) return img; // already a URL — pass through
        const buffer = Buffer.from(m[2], "base64");
        const ext = m[1].split("/")[1].replace("jpeg", "jpg");
        const { url } = await put(`listings/${crypto.randomUUID()}.${ext}`, buffer, {
          access: "public",
          contentType: m[1],
        });
        return url;
      })
    );
    return Response.json({ urls, hosted: true });
  } catch (err) {
    console.error("Photo upload error:", err);
    // Fall back to inline data URLs rather than losing the photos.
    return Response.json({ urls: images, hosted: false });
  }
}
