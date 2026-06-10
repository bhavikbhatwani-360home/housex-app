import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Users, CalendarCheck, Lock, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSuper } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function DeveloperDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireSuper();
  const { id } = await params;

  let dev;
  try {
    dev = await prisma.developer.findUnique({
      where: { id },
      include: {
        properties: { include: { units: true }, orderBy: { createdAt: "desc" } },
        _count: { select: { properties: true, leads: true, bookings: true } },
      },
    });
  } catch {
    dev = null;
  }
  if (!dev) notFound();

  let visits = 0;
  try {
    visits = await prisma.visit.count({ where: { property: { developerId: dev.id } } });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6 gap-3">
        <Link href="/admin/developers" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-[15px] font-semibold tracking-tight">{dev.company}</h1>
      </header>

      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-hx-line bg-white p-4 mb-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          <span className="inline-flex items-center gap-1.5 text-hx-slate"><span className="text-hx-muted">Contact:</span> {dev.name || "—"}</span>
          <span className="inline-flex items-center gap-1.5 text-hx-slate"><Mail className="w-3.5 h-3.5 text-hx-muted" /> {dev.email}</span>
          {dev.phone && <span className="inline-flex items-center gap-1.5 text-hx-slate"><Phone className="w-3.5 h-3.5 text-hx-muted" /> {dev.phone}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Stat icon={<Building2 className="w-4 h-4" />} label="Properties" value={dev._count.properties} />
          <Stat icon={<Users className="w-4 h-4" />} label="Leads" value={dev._count.leads} />
          <Stat icon={<CalendarCheck className="w-4 h-4" />} label="Visits" value={visits} />
          <Stat icon={<Lock className="w-4 h-4" />} label="Tokens" value={dev._count.bookings} />
        </div>

        <div className="text-[12px] uppercase tracking-wider text-hx-muted mb-2 font-medium">Their properties</div>
        {dev.properties.length === 0 ? (
          <p className="text-[13px] text-hx-muted">No properties listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dev.properties.map((p) => (
              <div key={p.id} className="rounded-xl border border-hx-line bg-white p-3.5">
                <div className="text-[14px] font-semibold truncate">{p.name}</div>
                <div className="text-[12px] text-hx-muted">{p.locality}</div>
                <div className="mt-1.5 text-[12.5px] text-hx-slate"><span className="num font-semibold">₹{p.priceMin}–{p.priceMax} L</span> · {p.bhk} · {p.units.length} units</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hx-line bg-white p-3.5">
      <span className="w-8 h-8 rounded-lg bg-hx-red/8 text-hx-red inline-flex items-center justify-center">{icon}</span>
      <div className="num text-[22px] font-bold tracking-tight mt-2">{value}</div>
      <div className="text-[11.5px] text-hx-muted">{label}</div>
    </div>
  );
}
