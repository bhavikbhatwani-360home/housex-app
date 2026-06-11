import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// S3-compatible object storage for listing media (photos, floor plans, brochure
// scans). Works with Cloudflare R2, AWS S3 or DigitalOcean Spaces — only the env
// vars change. When it isn't configured we return null so callers fall back to
// storing the image inline (a data URL), which keeps uploads working everywhere.
//
// Required env (all must be set to enable hosting):
//   S3_ENDPOINT          R2: https://<accountid>.r2.cloudflarestorage.com
//   S3_ACCESS_KEY_ID
//   S3_SECRET_ACCESS_KEY
//   S3_BUCKET
//   S3_PUBLIC_BASE_URL   public URL the bucket is served from (R2 public dev URL
//                        or your CDN/custom domain), e.g. https://pub-xxx.r2.dev
//   S3_REGION            optional; defaults to "auto" (correct for R2)

const {
  S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
  S3_BUCKET, S3_PUBLIC_BASE_URL, S3_REGION,
} = process.env;

export const storageConfigured = Boolean(
  S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET && S3_PUBLIC_BASE_URL
);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: S3_REGION || "auto",
      endpoint: S3_ENDPOINT,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID!, secretAccessKey: S3_SECRET_ACCESS_KEY! },
    });
  }
  return client;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "application/pdf": "pdf",
};

/**
 * Upload a base64 data URL and return its public URL. Returns null if storage
 * isn't configured (caller keeps the data URL inline instead).
 */
export async function uploadDataUrl(dataUrl: string): Promise<string | null> {
  if (!storageConfigured) return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const contentType = m[1];
  const ext = EXT[contentType] || "bin";
  const key = `listings/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(m[2], "base64");

  await getClient().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${S3_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}`;
}
