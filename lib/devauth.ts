import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { prisma } from "./db";

export const DEV_COOKIE = "hx_dev";

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "housex-dev-secret-fallback";
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const h = scryptSync(pw, salt, 64);
  const hb = Buffer.from(hash, "hex");
  return hb.length === h.length && timingSafeEqual(hb, h);
}

export function signSession(id: string): string {
  const sig = createHmac("sha256", secret()).update(id).digest("hex");
  return `${id}.${sig}`;
}

export function verifySession(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expect = createHmac("sha256", secret()).update(id).digest("hex");
  return sig === expect ? id : null;
}

export async function getDeveloperId(): Promise<string | null> {
  const c = await cookies();
  const t = c.get(DEV_COOKIE)?.value;
  return t ? verifySession(t) : null;
}

export async function getDeveloper() {
  const id = await getDeveloperId();
  if (!id) return null;
  try {
    return await prisma.developer.findUnique({ where: { id } });
  } catch {
    return null;
  }
}
