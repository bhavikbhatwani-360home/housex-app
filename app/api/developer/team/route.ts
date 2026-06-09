import { prisma } from "@/lib/db";
import { getMember, hashPassword } from "@/lib/devauth";

export const runtime = "nodejs";

const ROLES = ["owner", "manager", "agent"];

export async function POST(req: Request) {
  const me = await getMember();
  if (!me) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (me.role !== "owner") return Response.json({ error: "Only the owner can add team members." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const email = s(body.email).toLowerCase();
  const name = s(body.name);
  const password = typeof body.password === "string" ? body.password : "";
  const role = ROLES.includes(s(body.role)) ? s(body.role) : "manager";

  if (!email || !email.includes("@")) return Response.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 6) return Response.json({ error: "Set a password of at least 6 characters." }, { status: 400 });

  try {
    const exists = await prisma.teamMember.findUnique({ where: { email } });
    if (exists) return Response.json({ error: "That email is already in use." }, { status: 409 });
    await prisma.teamMember.create({
      data: { developerId: me.developerId, email, name: name || null, role, passwordHash: hashPassword(password) },
    });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Add team member error:", err);
    return Response.json({ error: "Could not add member." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const me = await getMember();
  if (!me) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (me.role !== "owner") return Response.json({ error: "Only the owner can remove members." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  if (memberId === me.id) return Response.json({ error: "You can't remove yourself." }, { status: 400 });

  try {
    const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!target || target.developerId !== me.developerId) return Response.json({ error: "Not found." }, { status: 404 });
    await prisma.teamMember.delete({ where: { id: memberId } });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Remove team member error:", err);
    return Response.json({ error: "Could not remove member." }, { status: 500 });
  }
}
