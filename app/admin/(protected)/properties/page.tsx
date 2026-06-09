import { Building2, AlertCircle, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getProperties() {
  try {
    const props = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: { units: true },
    });
    return { props, dbError: false };
  } catch {
    return { props: [], dbError: true };
  }
}

export default async function PropertiesPage() {
  const { props, dbError } = await getProperties();

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="w-4 h-4 text-hx-red" /> Properties
          <span className="num text-[12px] font-medium text-hx-muted">{props.length}</span>
        </h1>
        <span className="ml-auto text-[12px] text-hx-muted">Add/edit form — coming next</span>
      </header>

      <div className="p-6">
        {dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold">Database not connected yet</div>
              <p className="text-[13px] text-hx-muted mt-1 leading-relaxed">
                Add <code className="font-mono text-[12px] bg-hx-bg px-1 rounded">DATABASE_URL</code> in Vercel and redeploy. The 8 seed
                properties (and any you add) will appear here, and Baba will answer from them.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {props.map((p) => (
              <div key={p.id} className="rounded-xl border border-hx-line bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold tracking-tight truncate">{p.name}</div>
                    <div className="text-[12px] text-hx-muted truncate">{p.developer} · {p.locality}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-success/10 text-hx-success text-[10.5px] font-semibold shrink-0">
                    <BadgeCheck className="w-3 h-3" /> {p.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12.5px] text-hx-slate">
                  <span className="num font-semibold">₹{p.priceMin}–{p.priceMax} L</span>
                  <span className="text-hx-muted">·</span>
                  <span>{p.bhk}</span>
                  <span className="text-hx-muted">·</span>
                  <span>{p.facing}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-hx-line">
                  <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mb-1.5">
                    {p.units.length} units · RERA {p.reraId}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.units.slice(0, 6).map((u) => (
                      <span key={u.id} className="num text-[11px] px-2 py-0.5 rounded-md bg-hx-bg border border-hx-line">
                        F{u.floor} · ₹{u.priceLakh}L
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
