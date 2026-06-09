import Link from "next/link";
import { Briefcase, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

async function getDevelopers() {
  try {
    const devs = await prisma.developer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { properties: true, leads: true } } },
    });
    return { devs, dbError: false };
  } catch {
    return { devs: [], dbError: true };
  }
}

export default async function AdminDevelopers() {
  const { devs, dbError } = await getDevelopers();

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-hx-red" /> Developers
          <span className="num text-[12px] font-medium text-hx-muted">{devs.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div className="text-[14px] font-semibold">Database not connected yet</div>
          </div>
        ) : devs.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Briefcase className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No developer accounts yet</div>
            <p className="text-[13px] text-hx-muted mt-1">When developers sign up at /developer/signup, they appear here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium text-right">Properties</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {devs.map((d) => (
                  <tr key={d.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/developers/${d.id}`} className="text-[13.5px] font-medium hover:text-hx-red">{d.company}</Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-hx-slate">{d.name || "—"} · {d.email}</td>
                    <td className="px-4 py-3 text-right num text-[13px]">{d._count.properties}</td>
                    <td className="px-4 py-3 text-right num text-[13px]">{d._count.leads}</td>
                    <td className="px-4 py-3 text-right num text-[12.5px] text-hx-muted">{fmt(d.createdAt)}</td>
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
