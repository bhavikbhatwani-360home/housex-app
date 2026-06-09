import Link from "next/link";
import { Zap, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

function waited(d: Date) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function SpeedToLead() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let leads: { id: string; intent: string | null; status: string; interestedProperty: string | null; createdAt: Date }[] = [];
  try {
    leads = await prisma.lead.findMany({
      where: { developerId: dev.id, status: { in: ["New", "Token paid", "Visit booked"] } },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true, intent: true, status: true, interestedProperty: true, createdAt: true },
    });
  } catch {}

  const urgent = leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() > 2 * 3600_000);

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2"><Zap className="w-4 h-4 text-hx-red" /> Speed to lead</h1>
        {urgent.length > 0 && <span className="ml-auto text-[12.5px] font-semibold text-hx-danger">{urgent.length} waiting &gt; 2h</span>}
      </header>

      <div className="p-6 max-w-3xl">
        <p className="text-[13px] text-hx-muted mb-4">Respond fast — buyers who hear back within minutes are far more likely to convert. Oldest-waiting first.</p>
        {leads.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Zap className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">All caught up 🎉</div>
            <p className="text-[13px] text-hx-muted mt-1">No open leads waiting right now.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {leads.map((l) => {
              const w = waited(l.createdAt);
              const hot = Date.now() - new Date(l.createdAt).getTime() > 2 * 3600_000;
              return (
                <Link key={l.id} href={`/developer/leads/${l.id}`} className="block rounded-xl border bg-white p-4 hover:border-hx-red/30 transition-colors flex items-center gap-3" style={{ borderColor: hot ? "rgba(224,57,67,0.4)" : undefined }}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${hot ? "bg-hx-red" : "bg-hx-warning"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium line-clamp-1">{l.intent || "New conversation"}</div>
                    <div className="text-[12px] text-hx-muted">{l.interestedProperty || "—"} · {l.status}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[12.5px] font-semibold num shrink-0 ${hot ? "text-hx-danger" : "text-hx-slate"}`}>
                    <Clock className="w-3.5 h-3.5" /> {w}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
