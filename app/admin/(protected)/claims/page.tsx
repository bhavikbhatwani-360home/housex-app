import { BadgeCheck, AlertCircle, Mail, Phone, Building2, Clock } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ClaimActions from "./ClaimActions";

export const dynamic = "force-dynamic";

async function getClaims() {
  try {
    const claims = await prisma.listingClaim.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { property: { select: { id: true, name: true, locality: true, developerId: true } } },
    });
    return { claims, dbError: false };
  } catch {
    return { claims: [], dbError: true };
  }
}

const STATUS_CLS: Record<string, string> = {
  Pending: "bg-hx-warning/10 text-hx-warning",
  Approved: "bg-hx-success/10 text-hx-success",
  Rejected: "bg-hx-bg text-hx-slate",
};

export default async function ClaimsPage() {
  const { claims, dbError } = await getClaims();
  const pending = claims.filter((c) => c.status === "Pending").length;

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-hx-red" /> Developer claims
          {pending > 0 && (
            <span className="num text-[11px] font-semibold text-hx-warning bg-hx-warning/10 rounded-full px-2 py-0.5">{pending} pending</span>
          )}
        </h1>
      </header>

      <div className="p-6">
        {dbError ? (
          <DbError />
        ) : claims.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-8 text-center max-w-md mx-auto">
            <span className="w-12 h-12 rounded-2xl bg-hx-bg inline-flex items-center justify-center mx-auto mb-3"><BadgeCheck className="w-6 h-6 text-hx-muted" /></span>
            <div className="text-[14px] font-semibold">No claims yet</div>
            <p className="text-[13px] text-hx-muted mt-1">When a developer claims a seeded listing, it shows up here for you to verify and approve.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {claims.map((c) => (
              <div key={c.id} className="rounded-xl border border-hx-line bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${STATUS_CLS[c.status] || STATUS_CLS.Rejected}`}>
                        {c.status === "Pending" && <Clock className="w-3 h-3" />}
                        {c.status === "Approved" && <BadgeCheck className="w-3 h-3" />}
                        {c.status}
                      </span>
                      <Link href={`/property/${c.property.id}`} className="text-[14.5px] font-semibold tracking-tight truncate hover:text-hx-red">
                        {c.property.name}
                      </Link>
                      <span className="text-[12px] text-hx-muted truncate">· {c.property.locality}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-hx-slate">
                      <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-hx-muted" /> {c.name} · {c.company}</span>
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-hx-red"><Mail className="w-3.5 h-3.5 text-hx-muted" /> {c.email}</a>
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-hx-red num"><Phone className="w-3.5 h-3.5 text-hx-muted" /> {c.phone}</a>
                    </div>
                    {c.message && <p className="mt-2 text-[12.5px] text-hx-muted leading-relaxed">“{c.message}”</p>}
                    {c.status === "Approved" && (
                      <p className="mt-2 text-[11.5px] font-medium">
                        {c.property.developerId
                          ? <span className="text-hx-success">✓ Linked — leads now route to this developer.</span>
                          : <span className="text-hx-warning">Approved — onboard this developer under Developers, then link the listing in its edit page.</span>}
                      </p>
                    )}
                  </div>
                  {c.status === "Pending" && <ClaimActions id={c.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DbError() {
  return (
    <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
      <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
      <div>
        <div className="text-[14px] font-semibold">Database not connected</div>
        <p className="text-[13px] text-hx-muted mt-1">Claims appear here once the database is connected.</p>
      </div>
    </div>
  );
}
