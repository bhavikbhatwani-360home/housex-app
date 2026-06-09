import { Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  New: "bg-hx-red/10 text-hx-red",
  "Visit booked": "bg-hx-warning/10 text-hx-warning",
  Won: "bg-hx-success/10 text-hx-success",
};

export default async function DevLeads() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let leads: { id: string; intent: string | null; status: string; interestedProperty: string | null; createdAt: Date }[] = [];
  try {
    leads = await prisma.lead.findMany({
      where: { developerId: dev.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, intent: true, status: true, interestedProperty: true, createdAt: true },
    });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-hx-red" /> Leads
          <span className="num text-[12px] font-medium text-hx-muted">{leads.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Users className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No leads yet</div>
            <p className="text-[13px] text-hx-muted mt-1">When a buyer shows interest in one of your properties, the lead lands here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Buyer intent</th>
                  <th className="px-4 py-3 font-medium">Interested in</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Started</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60">
                    <td className="px-4 py-3">
                      <Link href={`/developer/leads/${l.id}`} className="text-[13.5px] font-medium line-clamp-1 hover:text-hx-red">{l.intent || "Conversation"}</Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-hx-slate">{l.interestedProperty || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor[l.status] || "bg-hx-ink/10 text-hx-slate"}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right num text-[12.5px] text-hx-muted">{fmt(l.createdAt)}</td>
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
