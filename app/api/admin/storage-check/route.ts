import { isAdmin } from "@/lib/admin";
import { storageConfigured, uploadDataUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only diagnostic: tells us what the LIVE deployment actually sees for
// object storage, and tries a real test upload. No secrets are returned — only
// whether each value is present (and the non-secret ones in full) so we can spot
// a missing/typo'd env var without exposing keys. Safe to delete once storage
// is confirmed working.
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const e = process.env;
  const present = (v?: string) => Boolean(v && v.length);

  const report = {
    storageConfigured,
    vars: {
      S3_ENDPOINT: e.S3_ENDPOINT || null,                 // not secret
      S3_BUCKET: e.S3_BUCKET || null,                     // not secret
      S3_PUBLIC_BASE_URL: e.S3_PUBLIC_BASE_URL || null,   // not secret
      S3_REGION: e.S3_REGION || null,                     // not secret
      S3_ACCESS_KEY_ID_present: present(e.S3_ACCESS_KEY_ID),
      S3_ACCESS_KEY_ID_len: (e.S3_ACCESS_KEY_ID || "").length,
      S3_SECRET_ACCESS_KEY_present: present(e.S3_SECRET_ACCESS_KEY),
      S3_SECRET_ACCESS_KEY_len: (e.S3_SECRET_ACCESS_KEY || "").length,
    },
    testUpload: { ok: false } as { ok: boolean; url?: string; error?: string },
  };

  // a 1x1 png — proves the live app can actually write to and address R2
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  try {
    const url = await uploadDataUrl(png);
    if (url) report.testUpload = { ok: true, url };
    else report.testUpload = { ok: false, error: "storage not configured (uploadDataUrl returned null)" };
  } catch (err) {
    report.testUpload = { ok: false, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
  }

  return Response.json(report);
}
