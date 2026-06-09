import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Building2, MessageSquare, CalendarCheck } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import LogoutButton from "../LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-dvh flex" style={{ background: "#f6f7f9" }}>
      {/* sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-hx-line flex flex-col">
        <div className="px-4 h-14 flex items-center gap-2.5 border-b border-hx-line">
          <span className="w-8 h-8 rounded-[9px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[66%] h-[66%] object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-[13.5px] font-semibold tracking-tight">HouseX</div>
            <div className="text-[10.5px] text-hx-muted -mt-0.5">Operator console</div>
          </div>
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5">
          <NavLink href="/admin/leads" icon={<Users className="w-4 h-4" />}>Leads</NavLink>
          <NavLink href="/admin/visits" icon={<CalendarCheck className="w-4 h-4" />}>Site visits</NavLink>
          <NavLink href="/admin/properties" icon={<Building2 className="w-4 h-4" />}>Properties</NavLink>
          <a href="/chat" target="_blank" className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium text-hx-slate hover:bg-hx-bg transition-colors">
            <MessageSquare className="w-4 h-4" /> Open Baba chat ↗
          </a>
        </nav>
        <div className="p-2.5 border-t border-hx-line">
          <LogoutButton />
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] font-medium text-hx-slate hover:bg-hx-bg transition-colors">
      {icon}
      {children}
    </Link>
  );
}
