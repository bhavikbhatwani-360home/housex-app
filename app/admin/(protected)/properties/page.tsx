import { Building2, AlertCircle, Plus, Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import StatusControl from "./StatusControl";

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "To enrich & approve" },
  { key: "live", label: "Live" },
];

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: filter = "all" } = await searchParams;
  const { props: allProps, dbError } = await getProperties();
  const pending = allProps.filter((p) => p.status !== "Live").length;
  const props =
    filter === "pending" ? allProps.filter((p) => p.status !== "Live")
    : filter === "live" ? allProps.filter((p) => p.status === "Live")
    : allProps;

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="w-4 h-4 text-hx-red" /> Properties
          <span className="num text-[12px] font-medium text-hx-muted">{props.length}</span>
          {pending > 0 && (
            <span className="num text-[11px] font-semibold text-hx-warning bg-hx-warning/10 rounded-full px-2 py-0.5">
              {pending} awaiting review
            </span>
          )}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/properties/import" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold hover:bg-hx-bg">
            <Upload className="w-4 h-4" /> Import from RERA
          </Link>
          <Link href="/admin/properties/new" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red">
            <Plus className="w-4 h-4" /> Add property
          </Link>
        </div>
      </header>

      {!dbError && (
        <div className="px-6 pt-4 flex items-center gap-1.5">
          {FILTERS.map((t) => {
            const active = filter === t.key || (t.key === "all" && filter === "all");
            return (
              <Link
                key={t.key}
                href={t.key === "all" ? "/admin/properties" : `/admin/properties?status=${t.key}`}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-colors ${active ? "bg-hx-ink text-white" : "text-hx-slate hover:bg-hx-bg"}`}
              >
                {t.label}
                {t.key === "pending" && pending > 0 && (
                  <span className={`num text-[10.5px] font-semibold rounded-full px-1.5 py-0.5 ${active ? "bg-white/20" : "bg-hx-warning/15 text-hx-warning"}`}>{pending}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <div className="p-6">
        {dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold">Database not connected yet</div>
              <p className="text-[13px] text-hx-muted mt-1 leading-relaxed">
                Add <code className="font-mono text-[12px] bg-hx-bg px-1 rounded">DATABASE_URL</code> in Vercel and redeploy. The 8 seed
                properties (and any you add) will appear here, and HouseX AI will answer from them.
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
                  <StatusControl id={p.id} status={p.status} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12.5px] text-hx-slate">
                  {p.priceMin > 0 ? (
                    <>
                      <span className="num font-semibold">₹{p.priceMin}–{p.priceMax} L</span>
                      <span className="text-hx-muted">·</span>
                      <span>{p.bhk || "—"}</span>
                      <span className="text-hx-muted">·</span>
                      <span>{p.facing}</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[12px] text-hx-warning font-medium">
                      <Sparkles className="w-3.5 h-3.5" /> Skeleton — needs brochure &amp; price
                    </span>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-hx-line flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mb-1.5">
                      {p.units.length} units · RERA {p.reraId || "—"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.units.slice(0, 6).map((u) => (
                        <span key={u.id} className="num text-[11px] px-2 py-0.5 rounded-md bg-hx-bg border border-hx-line">
                          F{u.floor} · ₹{u.priceLakh}L
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/admin/properties/${p.id}/edit`} className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-hx-line text-[12px] font-semibold text-hx-slate hover:bg-hx-bg hover:text-hx-red">
                    {p.priceMin > 0 ? "Edit" : "Enrich"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
