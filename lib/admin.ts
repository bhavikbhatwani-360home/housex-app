import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

export const ADMIN_COOKIE = "hx_admin";
export type AdminRole = "super" | "sub";

/** Cookie token derived from the role-specific password. */
export function tokenFor(role: AdminRole): string {
  const pw = role === "super" ? process.env.ADMIN_PASSWORD || "" : process.env.SUBADMIN_PASSWORD || "";
  return createHash("sha256").update(`housex:${role}:${pw}`).digest("hex");
}

/** Which admin role (if any) is signed in. */
export async function getAdminRole(): Promise<AdminRole | null> {
  const c = await cookies();
  const v = c.get(ADMIN_COOKIE)?.value;
  if (!v) return null;
  if (process.env.ADMIN_PASSWORD && v === tokenFor("super")) return "super";
  if (process.env.SUBADMIN_PASSWORD && v === tokenFor("sub")) return "sub";
  return null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminRole()) !== null;
}

/** Gate for super-admin-only pages: sub-admins are sent to the property desk. */
export async function requireSuper(): Promise<void> {
  const role = await getAdminRole();
  if (role !== "super") redirect("/admin/properties");
}
