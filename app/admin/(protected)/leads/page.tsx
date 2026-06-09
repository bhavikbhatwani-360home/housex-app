import Link from "next/link";
import { Users, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  intent: string | null;
  status: string;
  createdAt: Date;
  messageCount: number;
};

async function getLeads(): Promise<{ rows: LeadRow[]; dbError: boolean }> {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { conversation: { include: { _count: { select: { messages: true } } } } },
    });
    return {
      dbError: false,
      rows: leads.map((l) => ({
        id: l.id,
        intent: l.intent,
        status: l.status,
        createdAt: l.createdAt,
        messageCount: l.conversation?._count.messages ?? 0,
      })),
    };
  } catch {
    return { rows: [], dbError: true };
  }
}

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusColor: Record<string, string> = {
  New: "bg-hx-red/10 text-hx-red",
  Contacted: "bg-hx-warning/10 text-hx-warning",
  Won: "bg-hx-success/10 text-hx-success",
};

export default async function LeadsPage() {
  const { rows, dbError } = await getLeads();

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-hx-red" /> Leads
          <span className="num text-[12px] font-medium text-hx-muted">{rows.length}</span>
        </h1>
      </header>

      <div className="p-6">
        {dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-[14px] font-semibold">Database not connected yet</div>
              <p className="text-[13px] text-hx-muted mt-1 leading-relaxed">
                Add <code className="font-mono text-[12px] bg-hx-bg px-1 rounded">DATABASE_URL</code> in Vercel and redeploy.
                Once connected, every buyer who chats with Baba shows up here automatically.
              </p>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Users className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No leads yet</div>
            <p className="text-[13px] text-hx-muted mt-1">When buyers chat with Baba, their leads will appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Buyer intent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Messages</th>
                  <th className="px-4 py-3 font-medium text-right">Started</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${l.id}`} className="text-[13.5px] font-medium text-hx-ink hover:text-hx-red line-clamp-1">
                        {l.intent || "Conversation"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor[l.status] || "bg-hx-ink/10 text-hx-slate"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right num text-[13px] text-hx-slate">{l.messageCount}</td>
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
