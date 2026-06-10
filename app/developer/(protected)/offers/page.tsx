import { BadgePercent } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  Pending: "bg-hx-warning/10 text-hx-warning",
  Accepted: "bg-hx-success/10 text-hx-success",
  Countered: "bg-hx-red/10 text-hx-red",
  Declined: "bg-hx-ink/10 text-hx-slate",
};

export default async function DevOffers() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let offers: { id: string; propertyName: string; offerPriceLakh: number; listPriceLakh: number | null; counterPriceLakh: number | null; status: string; createdAt: Date }[] = [];
  try {
    offers = await prisma.offer.findMany({
      where: { developerId: dev.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, propertyName: true, offerPriceLakh: true, listPriceLakh: true, counterPriceLakh: true, status: true, createdAt: true },
    });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <BadgePercent className="w-4 h-4 text-hx-red" /> Rate offers
          <span className="num text-[12px] font-medium text-hx-muted">{offers.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {offers.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><BadgePercent className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No offers sent yet</div>
            <p className="text-[13px] text-hx-muted mt-1">Open a lead and use <span className="font-semibold">Send rate offer</span> to negotiate a price directly in the buyer&apos;s chat.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium text-right">List</th>
                  <th className="px-4 py-3 font-medium text-right">Offered</th>
                  <th className="px-4 py-3 font-medium text-right">Counter</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Sent</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60">
                    <td className="px-4 py-3 text-[13.5px] font-medium">{o.propertyName}</td>
                    <td className="px-4 py-3 text-right num text-[13px] text-hx-muted">{o.listPriceLakh ? `₹${o.listPriceLakh} L` : "—"}</td>
                    <td className="px-4 py-3 text-right num text-[13px] font-semibold">₹{o.offerPriceLakh} L</td>
                    <td className="px-4 py-3 text-right num text-[13px] text-hx-slate">{o.counterPriceLakh ? `₹${o.counterPriceLakh} L` : "—"}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor[o.status] || "bg-hx-ink/10 text-hx-slate"}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-right num text-[12.5px] text-hx-muted">{fmt(o.createdAt)}</td>
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
