import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Approve or reject a developer's claim on a seeded listing.
// On approve: if a developer account already exists for the claim email, link
// the listing to it (leads now route to that developer). Otherwise mark it
// approved and tell the operator to onboard the developer, then link via edit.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let action: string;
  try {
    const body = await req.json();
    action = typeof body?.action === "string" ? body.action : "";
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject")
    return Response.json({ error: "Invalid action" }, { status: 400 });

  const claim = await prisma.listingClaim.findUnique({ where: { id } }).catch(() => null);
  if (!claim) return Response.json({ error: "Claim not found." }, { status: 404 });

  if (action === "reject") {
    await prisma.listingClaim.update({ where: { id }, data: { status: "Rejected" } });
    return Response.json({ ok: true, status: "Rejected" });
  }

  // approve — try to link to an existing developer account by email
  try {
    const account = claim.email
      ? await prisma.developer.findUnique({ where: { email: claim.email }, select: { id: true, company: true } }).catch(() => null)
      : null;

    await prisma.$transaction(async (tx) => {
      await tx.listingClaim.update({ where: { id }, data: { status: "Approved" } });
      if (account) {
        await tx.property.update({
          where: { id: claim.propertyId },
          data: { developerId: account.id, developer: account.company },
        });
      }
    });

    return Response.json({
      ok: true,
      status: "Approved",
      linked: Boolean(account),
      hint: account
        ? undefined
        : "No developer account for this email yet. Onboard them under Developers, then link this listing in its edit page.",
    });
  } catch (err) {
    console.error("Claim approve error:", err);
    return Response.json({ error: "Could not approve — try again." }, { status: 500 });
  }
}
