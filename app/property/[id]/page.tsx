import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, MapPin, Sparkles, Check, Building2, Compass,
  Train, IndianRupee, Layers, CalendarPlus, Lock, MessageSquare,
} from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function emiPerMonth(priceLakh: number) {
  const P = priceLakh * 100000;
  const r = 0.086 / 12;
  const n = 240;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi).toLocaleString("en-IN");
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let property;
  try {
    property = await prisma.property.findUnique({
      where: { id },
      include: { units: { where: { available: true }, orderBy: { floor: "asc" } } },
    });
  } catch {
    property = null;
  }
  if (!property) notFound();

  const p = property;
  const range = p.priceMin === p.priceMax ? `₹${p.priceMin} L` : `₹${p.priceMin}–${p.priceMax} L`;
  const facts = [
    { icon: Building2, label: "Configuration", value: p.bhk },
    { icon: Compass, label: "Facing", value: p.facing },
    { icon: Layers, label: "Carpet area", value: `${p.carpetSqft} sqft` },
    { icon: Train, label: "From station", value: `${p.distanceToStationM} m` },
  ];

  return (
    <div className="min-h-dvh bg-white text-hx-ink pb-[88px]">
      {/* top bar */}
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur border-b border-hx-line flex items-center px-4 gap-3">
        <Link href="/chat" className="w-9 h-9 rounded-full border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold tracking-tight truncate">{p.name}</div>
          <div className="text-[11px] text-hx-muted truncate">{p.developer}</div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* hero */}
        <div className="relative h-[200px] sm:h-[240px]" style={{ backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 16px,#FAEFE7 16px 32px)" }}>
          <div className="absolute inset-0 flex items-center justify-center text-hx-muted text-[11px] font-mono">[ {p.name} · tower view ]</div>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold"><BadgeCheck className="w-3 h-3" /> RERA verified</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-hx-ink text-[11px] font-semibold">{p.status}</span>
          </div>
        </div>

        <div className="px-5">
          {/* title + price */}
          <div className="pt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold tracking-tight">{p.name}</h1>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-hx-slate">
                <MapPin className="w-3.5 h-3.5" /> {p.locality}, {p.city}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="num text-[22px] font-extrabold tracking-tight">{range}</div>
              <div className="text-[11px] text-hx-muted">{p.bhk} · {p.facing}</div>
            </div>
          </div>

          {/* why it fits */}
          <div className="mt-5 rounded-2xl border border-hx-line bg-hx-bg/60 p-4">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-hx-red mb-2"><Sparkles className="w-3.5 h-3.5" /> Why this home</div>
            <div className="flex flex-wrap gap-2">
              {[`RERA-verified`, `${p.distanceToStationM} m from station`, `${p.facing}-facing`, ...p.amenities.slice(0, 4)].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-hx-line text-[12px] font-medium text-hx-slate">
                  <Check className="w-3 h-3 text-hx-success" /> {chip}
                </span>
              ))}
            </div>
          </div>

          {/* affordability */}
          <div className="mt-4 rounded-2xl border border-hx-line p-4 flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><IndianRupee className="w-5 h-5" /></span>
            <div>
              <div className="text-[12px] text-hx-muted">Estimated EMI (from {`₹${p.priceMin} L`}, 8.6% · 20 yrs)</div>
              <div className="num text-[20px] font-bold tracking-tight">₹{emiPerMonth(p.priceMin)}<span className="text-[13px] font-medium text-hx-muted">/month</span></div>
            </div>
          </div>

          {/* key facts */}
          <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Key facts</div>
          <div className="grid grid-cols-2 gap-2.5">
            {facts.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="rounded-xl border border-hx-line p-3">
                  <span className="w-8 h-8 rounded-lg bg-hx-bg text-hx-slate inline-flex items-center justify-center"><Icon className="w-4 h-4" /></span>
                  <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mt-2">{f.label}</div>
                  <div className="text-[14px] font-semibold">{f.value}</div>
                </div>
              );
            })}
          </div>

          {/* available units */}
          <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Available units</div>
          <div className="rounded-xl border border-hx-line overflow-hidden">
            {p.units.length === 0 && <div className="p-4 text-[13px] text-hx-muted">Contact the developer for availability.</div>}
            {p.units.map((u, i) => (
              <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-hx-line" : ""}`}>
                <div className="text-[13.5px] font-medium">Floor {u.floor} · {u.facing}-facing</div>
                <div className="flex items-center gap-3">
                  <span className="num text-[12px] text-hx-muted">{u.carpetSqft} sqft</span>
                  <span className="num text-[15px] font-bold">₹{u.priceLakh} L</span>
                </div>
              </div>
            ))}
          </div>

          {/* amenities */}
          {p.amenities.length > 0 && (
            <>
              <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hx-bg border border-hx-line text-[12.5px] text-hx-slate"><Check className="w-3.5 h-3.5 text-hx-success" /> {a}</span>
                ))}
              </div>
            </>
          )}

          {/* trust */}
          <div className="mt-6 rounded-2xl border border-hx-line p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center shrink-0"><BadgeCheck className="w-5 h-5" /></span>
            <div>
              <div className="text-[13.5px] font-semibold">RERA verified · {p.reraId || "registered"}</div>
              <div className="text-[12px] text-hx-muted mt-0.5">By {p.developer}. Every HouseX listing is checked — no fake listings, no brokers.</div>
            </div>
          </div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hx-line px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto grid grid-cols-[1fr_auto_auto] gap-2">
          <Link href="/chat" className="h-11 rounded-xl bg-hx-ink text-white text-[13.5px] font-semibold inline-flex items-center justify-center gap-1.5">
            <MessageSquare className="w-4 h-4" /> Ask Baba about this
          </Link>
          <Link href="/chat" className="h-11 px-3.5 rounded-xl bg-white border border-hx-line text-hx-ink text-[13px] font-semibold inline-flex items-center justify-center gap-1.5">
            <CalendarPlus className="w-4 h-4" /> Visit
          </Link>
          <Link href="/chat" className="h-11 px-3.5 rounded-xl bg-hx-red text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-hx-red">
            <Lock className="w-4 h-4" /> ₹999
          </Link>
        </div>
      </div>
    </div>
  );
}
