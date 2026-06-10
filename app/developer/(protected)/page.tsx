import Link from "next/link";
import { Users, CalendarCheck, Building2, Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

export default async function DeveloperDashboard() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let properties = 0, leads = 0, visits = 0;
  try {
    [properties, leads, visits] = await Promise.all([
      prisma.property.count({ where: { developerId: dev.id } }),
      prisma.lead.count({ where: { developerId: dev.id } }),
      prisma.visit.count({ where: { property: { developerId: dev.id } } }),
    ]);
  } catch {
    // db not reachable — show zeros
  }

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight">Dashboard</h1>
        <span className="ml-auto text-[13px] text-hx-muted">Welcome, {dev.name || dev.company}</span>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <Stat icon={<Building2 className="w-5 h-5" />} label="Your properties" value={properties} />
          <Stat icon={<Users className="w-5 h-5" />} label="Leads" value={leads} />
          <Stat icon={<CalendarCheck className="w-5 h-5" />} label="Site visits" value={visits} />
        </div>

        {properties === 0 && (
          <div className="mt-6 rounded-xl border border-hx-line bg-white p-6 max-w-3xl">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></span>
              <div>
                <div className="text-[15px] font-semibold">List your first project</div>
                <p className="text-[13px] text-hx-muted mt-1 leading-relaxed max-w-md">
                  Add a property with its floor-wise units and pricing. HouseX AI will start recommending it to matching buyers
                  immediately — and every interested buyer becomes a lead right here.
                </p>
                <Link href="/developer/properties/new" className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red">
                  <Plus className="w-4 h-4" /> Add property
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hx-line bg-white p-4">
      <span className="w-9 h-9 rounded-lg bg-hx-red/8 text-hx-red inline-flex items-center justify-center">{icon}</span>
      <div className="num text-[26px] font-bold tracking-tight mt-3">{value}</div>
      <div className="text-[12.5px] text-hx-muted">{label}</div>
    </div>
  );
}
