import { CalendarCheck, Building2, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function DevVisits() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let visits: { id: string; propertyName: string; date: string; slot: string; mode: string; status: string; createdAt: Date; buyerName: string | null; buyerPhone: string | null }[] = [];
  try {
    visits = await prisma.visit.findMany({
      where: { property: { developerId: dev.id } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, propertyName: true, date: true, slot: true, mode: true, status: true, createdAt: true, buyerName: true, buyerPhone: true },
    });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-hx-red" /> Site visits
          <span className="num text-[12px] font-medium text-hx-muted">{visits.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {visits.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><CalendarCheck className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No visits yet</div>
            <p className="text-[13px] text-hx-muted mt-1">Site visits buyers book for your properties show up here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Booked</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60">
                    <td className="px-4 py-3"><div className="text-[13.5px] font-medium">{v.buyerName || "—"}</div><div className="num text-[12px] text-hx-muted">{v.buyerPhone || ""}</div></td>
                    <td className="px-4 py-3 text-[13px] text-hx-slate">{v.propertyName}</td>
                    <td className="px-4 py-3 text-[13px] text-hx-slate num">{v.date} · {v.slot}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-hx-slate">
                        {v.mode === "Video" ? <Video className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}{v.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-hx-warning/10 text-hx-warning">{v.status}</span></td>
                    <td className="px-4 py-3 text-right num text-[12.5px] text-hx-muted">{fmt(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
