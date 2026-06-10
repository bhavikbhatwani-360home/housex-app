import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const STATUSES = ["Live", "Pending", "Draft"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let status: string;
  try {
    const body = await req.json();
    status = typeof body?.status === "string" ? body.status : "";
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (!STATUSES.includes(status))
    return Response.json({ error: "Invalid status" }, { status: 400 });

  try {
    await prisma.property.update({ where: { id }, data: { status } });
    return Response.json({ ok: true, status });
  } catch (err) {
    console.error("Update property status error:", err);
    return Response.json({ error: "Could not update — is the database connected?" }, { status: 500 });
  }
}
