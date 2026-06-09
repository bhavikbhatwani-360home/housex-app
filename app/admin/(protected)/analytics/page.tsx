import { BarChart3, Users, CalendarCheck, Lock, Building2, Briefcase, AlertCircle, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [leads, visits, tokens, properties, developers, revenueAgg, byStatus] = await Promise.all([
      prisma.lead.count(),
      prisma.visit.count(),
      prisma.booking.count({ where: { status: "Paid" } }),
      prisma.property.count(),
      prisma.developer.count(),
      prisma.booking.aggregate({ _sum: { amount: true }, where: { status: "Paid" } }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    return { leads, visits, tokens, properties, developers, revenue: revenueAgg._sum.amount ?? 0, byStatus, dbError: false };
  } catch {
    return { leads: 0, visits: 0, tokens: 0, properties: 0, developers: 0, revenue: 0, byStatus: [], dbError: true };
  }
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default async function Analytics() {
  const s = await getStats();

  const funnel = [
    { label: "Leads", value: s.leads, of: s.leads },
    { label: "Site visits booked", value: s.visits, of: s.leads },
    { label: "Tokens paid (₹999)", value: s.tokens, of: s.leads },
  ];

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2"><BarChart3 className="w-4 h-4 text-hx-red" /> Analytics</h1>
      </header>

      <div className="p-6 max-w-4xl">
        {s.dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div className="text-[14px] font-semibold">Database not connected yet</div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Kpi icon={<Users className="w-4 h-4" />} label="Total leads" value={s.leads} />
              <Kpi icon={<CalendarCheck className="w-4 h-4" />} label="Site visits" value={s.visits} />
              <Kpi icon={<Lock className="w-4 h-4" />} label="Tokens paid" value={s.tokens} />
              <Kpi icon={<TrendingUp className="w-4 h-4" />} label="₹ collected" value={`₹${s.revenue.toLocaleString("en-IN")}`} />
              <Kpi icon={<Building2 className="w-4 h-4" />} label="Properties" value={s.properties} />
              <Kpi icon={<Briefcase className="w-4 h-4" />} label="Developers" value={s.developers} />
            </div>

            {/* funnel */}
            <div className="mt-6 rounded-xl border border-hx-line bg-white p-5">
              <div className="text-[13px] font-semibold mb-4">Conversion funnel</div>
              <div className="space-y-3">
                {funnel.map((f) => {
                  const width = pct(f.value, f.of);
                  return (
                    <div key={f.label}>
                      <div className="flex items-center justify-between text-[12.5px] mb-1">
                        <span className="text-hx-slate">{f.label}</span>
                        <span className="num font-semibold">{f.value} <span className="text-hx-muted font-normal">· {width}%</span></span>
                      </div>
                      <div className="h-2.5 rounded-full bg-hx-bg overflow-hidden">
                        <div className="h-full rounded-full bg-hx-red" style={{ width: `${Math.max(width, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-hx-line flex gap-6 text-[12.5px]">
                <span className="text-hx-slate">Lead → visit: <span className="num font-semibold text-hx-ink">{pct(s.visits, s.leads)}%</span></span>
                <span className="text-hx-slate">Lead → token: <span className="num font-semibold text-hx-ink">{pct(s.tokens, s.leads)}%</span></span>
              </div>
            </div>

            {/* leads by status */}
            {s.byStatus.length > 0 && (
              <div className="mt-6 rounded-xl border border-hx-line bg-white p-5">
                <div className="text-[13px] font-semibold mb-3">Leads by stage</div>
                <div className="flex flex-wrap gap-2">
                  {s.byStatus.map((row) => (
                    <span key={row.status} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hx-bg border border-hx-line text-[12.5px]">
                      {row.status} <span className="num font-semibold">{row._count._all}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-hx-line bg-white p-4">
      <span className="w-8 h-8 rounded-lg bg-hx-red/8 text-hx-red inline-flex items-center justify-center">{icon}</span>
      <div className="num text-[24px] font-bold tracking-tight mt-2.5">{value}</div>
      <div className="text-[12px] text-hx-muted">{label}</div>
    </div>
  );
}
