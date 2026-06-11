import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { prisma } from "./db";

export const ADMIN_COOKIE = "hx_admin";
export type AdminRole = "super" | "sub";

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "housex-admin-secret-fallback";
}

// ── per-user staff accounts (username + password) ──
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const h = scryptSync(pw, salt, 64);
  const hb = Buffer.from(hash, "hex");
  return hb.length === h.length && timingSafeEqual(hb, h);
}
export function signStaff(id: string): string {
  return `s.${id}.${createHmac("sha256", secret()).update(id).digest("hex")}`;
}
function staffIdFromCookie(v: string): string | null {
  if (!v.startsWith("s.")) return null;
  const rest = v.slice(2);
  const i = rest.lastIndexOf(".");
  if (i < 0) return null;
  const id = rest.slice(0, i);
  const sig = rest.slice(i + 1);
  return sig === createHmac("sha256", secret()).update(id).digest("hex") ? id : null;
}

// ── legacy env-password login (kept so the owner's existing login still works) ──
export function tokenFor(role: AdminRole): string {
  const pw = role === "super" ? process.env.ADMIN_PASSWORD || "" : process.env.SUBADMIN_PASSWORD || "";
  return createHash("sha256").update(`housex:${role}:${pw}`).digest("hex");
}

/** Which admin role (if any) is signed in. */
export async function getAdminRole(): Promise<AdminRole | null> {
  const c = await cookies();
  const v = c.get(ADMIN_COOKIE)?.value;
  if (!v) return null;

  // staff-account cookie
  const sid = staffIdFromCookie(v);
  if (sid) {
    const u = await prisma.staffUser
      .findUnique({ where: { id: sid }, select: { role: true, active: true } })
      .catch(() => null);
    if (u && u.active) return u.role === "super" ? "super" : "sub";
    return null;
  }

  // legacy env passwords
  if (process.env.ADMIN_PASSWORD && v === tokenFor("super")) return "super";
  if (process.env.SUBADMIN_PASSWORD && v === tokenFor("sub")) return "sub";
  return null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}

/** Gate for super-admin-only pages: field staff are sent to the properties desk. */
export async function requireSuper(): Promise<void> {
  const role = await getAdminRole();
  if (role !== "super") redirect("/admin/properties");
}
