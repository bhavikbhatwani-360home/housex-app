import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, MessageSquare, Train } from "lucide-react";
import { prisma } from "@/lib/db";
import { STAGES, STAGE_BADGE_SOLID } from "@/lib/stage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse projects — HouseX",
  description: "RERA-verified projects in Mumbai (MMR) — ready to move, under construction and new launches. Real prices, no brokers.",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; locality?: string }>;
}) {
  const sp = await searchParams;
  const stage = STAGES.find((s) => s === sp.stage) || null;
  const locality = (sp.locality || "").trim() || null;

  let all: {
    id: string; name: string; developer: string; locality: string; bhk: string; stage: string;
    priceMin: number; priceMax: number; distanceToStationM: number; images: string[];
  }[] = [];
  try {
    all = await prisma.property.findMany({
      where: { status: "Live" },
      select: {
        id: true, name: true, developer: true, locality: true, bhk: true, stage: true,
        priceMin: true, priceMax: true, distanceToStationM: true, images: true,
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    });
  } catch {
    all = [];
  }

  const counts = Object.fromEntries(STAGES.map((s) => [s, all.filter((p) => p.stage === s).length]));
  const localities = Array.from(new Set(all.map((p) => p.locality))).sort();
  const list = all
    .filter((p) => (stage ? p.stage === stage : true))
    .filter((p) => (locality ? p.locality === locality : true));

  // preserve the other filter when toggling one
  const href = (next: { stage?: string | null; locality?: string | null }) => {
    const q = new URLSearchParams();
    const st = next.stage === undefined ? stage : next.stage;
    const lo = next.locality === undefined ? locality : next.locality;
    if (st) q.set("stage", st);
    if (lo) q.set("locality", lo);
    const qs = q.toString();
    return `/properties${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-dvh bg-white text-hx-ink">
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur border-b border-hx-line flex items-center px-4 gap-3">
        <Link href="/" className="w-9 h-9 rounded-full border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold tracking-tight">Browse projects</div>
          <div className="text-[11px] text-hx-muted">RERA-verified · real prices · no brokers</div>
        </div>
        <Link href="/chat" className="h-9 px-3.5 rounded-xl bg-hx-red text-white text-[12.5px] font-semibold inline-flex items-center gap-1.5 shadow-hx-red shrink-0">
          <MessageSquare className="w-4 h-4" /> Ask AI
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-12">
        {/* stage tabs */}
        <div className="pt-4 flex gap-2 overflow-x-auto no-scrollbar">
          <Link href={href({ stage: null })} className={`shrink-0 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold inline-flex items-center ${!stage ? "border-hx-ink bg-hx-ink text-white" : "border-hx-line text-hx-slate"}`}>
            All · {all.length}
          </Link>
          {STAGES.map((s) => (
            <Link key={s} href={href({ stage: stage === s ? null : s })} className={`shrink-0 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold inline-flex items-center gap-1.5 ${stage === s ? "border-hx-ink bg-hx-ink text-white" : "border-hx-line text-hx-slate"}`}>
            {s} · {counts[s] ?? 0}
            </Link>
          ))}
        </div>

        {/* locality chips */}
        {localities.length > 1 && (
          <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            {locality && (
              <Link href={href({ locality: null })} className="shrink-0 h-8 px-3 rounded-full bg-hx-red/10 text-hx-red text-[12px] font-semibold inline-flex items-center">
                {locality} ✕
              </Link>
            )}
            {localities.filter((l) => l !== locality).map((l) => (
              <Link key={l} href={href({ locality: l })} className="shrink-0 h-8 px-3 rounded-full border border-hx-line text-[12px] font-medium text-hx-slate inline-flex items-center gap-1 hover:bg-hx-bg">
                <MapPin className="w-3 h-3" /> {l}
              </Link>
            ))}
          </div>
        )}

        {/* results */}
        {list.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[16px] font-semibold">No projects here yet</div>
            <p className="mt-1 text-[13px] text-hx-muted max-w-xs mx-auto">
              {stage ? `No ${stage.toLowerCase()} projects${locality ? ` in ${locality}` : ""} right now.` : "Nothing matches these filters yet."} Try another filter — or ask HouseX AI what&apos;s coming up.
            </p>
            <Link href="/chat" className="mt-4 inline-flex h-11 px-5 rounded-xl bg-hx-red text-white text-[13.5px] font-semibold items-center shadow-hx-red">Ask HouseX AI</Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {list.map((p) => {
              const range = p.priceMin === p.priceMax ? `₹${p.priceMin} L` : `₹${p.priceMin}–${p.priceMax} L`;
              return (
                <Link key={p.id} href={`/property/${p.id}`} className="rounded-2xl border border-hx-line overflow-hidden hover:border-hx-red/40 transition-colors bg-white">
                  <div className="relative h-[150px] bg-hx-bg">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 14px,#FAEFE7 14px 28px)" }} />
                    )}
                    <span className={`absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${STAGE_BADGE_SOLID[p.stage] || "bg-white/95 text-hx-slate"}`}>{p.stage}</span>
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-hx-ink text-[10.5px] font-semibold"><BadgeCheck className="w-3 h-3 text-hx-success" /> RERA</span>
                  </div>
                  <div className="p-3.5">
                    <div className="text-[14.5px] font-semibold truncate">{p.name}</div>
                    <div className="mt-0.5 text-[12px] text-hx-muted truncate">{p.developer} · {p.locality}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="num text-[15px] font-extrabold tracking-tight">{range}</span>
                      <span className="text-[11.5px] text-hx-slate inline-flex items-center gap-1 shrink-0">{p.bhk}{p.distanceToStationM > 0 && <> · <Train className="w-3 h-3" /> {p.distanceToStationM} m</>}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
