import Link from "next/link";
import { Building2, BadgeCheck, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getMember, canManageProperties, type Role } from "@/lib/devauth";

export const dynamic = "force-dynamic";

export default async function DevProperties() {
  const member = await getMember();
  if (!member) return null;
  const dev = member.developer;
  const canManage = canManageProperties(member.role as Role);

  const props = await prisma.property
    .findMany({
      where: { developerId: dev.id },
      orderBy: { createdAt: "desc" },
      include: { units: true },
    })
    .catch(() => []);

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="w-4 h-4 text-hx-red" /> Properties
          <span className="num text-[12px] font-medium text-hx-muted">{props.length}</span>
        </h1>
        {canManage && (
          <Link href="/developer/properties/new" className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red">
            <Plus className="w-4 h-4" /> Add property
          </Link>
        )}
      </header>
      <div className="p-6">
        {props.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Building2 className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No properties yet</div>
            <p className="text-[13px] text-hx-muted mt-1 mb-4">{canManage ? "Add your first project so Baba can start recommending it to buyers." : "No properties listed yet."}</p>
            {canManage && (
              <Link href="/developer/properties/new" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red">
                <Plus className="w-4 h-4" /> Add property
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {props.map((p) => (
              <Link key={p.id} href={canManage ? `/developer/properties/${p.id}/edit` : `/property/${p.id}`} className="rounded-xl border border-hx-line bg-white p-4 hover:border-hx-red/30 transition-colors block">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold tracking-tight truncate">{p.name}</div>
                    <div className="text-[12px] text-hx-muted truncate">{p.locality}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-success/10 text-hx-success text-[10.5px] font-semibold shrink-0"><BadgeCheck className="w-3 h-3" /> {p.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12.5px] text-hx-slate">
                  <span className="num font-semibold">₹{p.priceMin}–{p.priceMax} L</span>
                  <span className="text-hx-muted">·</span><span>{p.bhk}</span>
                  <span className="text-hx-muted">·</span><span>{p.facing}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-hx-line text-[10.5px] uppercase tracking-wider text-hx-muted flex items-center justify-between">
                  <span>{p.units.length} units · RERA {p.reraId || "—"}</span>
                  <span className="text-hx-red font-semibold normal-case">{canManage ? "Edit →" : "View →"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
