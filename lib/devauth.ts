import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { prisma } from "./db";

export const DEV_COOKIE = "hx_dev";
export type Role = "owner" | "manager" | "agent";

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

async function getMemberId(): Promise<string | null> {
  const c = await cookies();
  const t = c.get(DEV_COOKIE)?.value;
  return t ? verifySession(t) : null;
}

/** The logged-in team member (login identity), including their org. */
/**
 * Stateless password-reset token: id.expiry.hmac(id+expiry+currentHash).
 * Expires after 1 hour and is invalidated automatically once the password changes.
 */
export function makeResetToken(memberId: string, passwordHash: string): string {
  const exp = Date.now() + 60 * 60_000;
  const sig = createHmac("sha256", secret()).update(`reset:${memberId}:${exp}:${passwordHash}`).digest("hex");
  return `${memberId}.${exp}.${sig}`;
}

export async function verifyResetToken(token: string): Promise<{ id: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  try {
    const member = await prisma.teamMember.findUnique({ where: { id }, select: { passwordHash: true } });
    if (!member) return null;
    const expect = createHmac("sha256", secret()).update(`reset:${id}:${exp}:${member.passwordHash}`).digest("hex");
    return sig === expect ? { id } : null;
  } catch {
    return null;
  }
}

export async function getMember() {
  const id = await getMemberId();
  if (!id) return null;
  try {
    return await prisma.teamMember.findUnique({ where: { id }, include: { developer: true } });
  } catch {
    return null;
  }
}

/** The org (company) the logged-in member belongs to — used to scope all data. */
export async function getDeveloper() {
  const m = await getMember();
  return m?.developer ?? null;
}

export async function getRole(): Promise<Role | null> {
  const m = await getMember();
  return (m?.role as Role) ?? null;
}

/** owner + manager can manage properties; agent is view-only. */
export function canManageProperties(role: Role | null | undefined) {
  return role === "owner" || role === "manager";
}
