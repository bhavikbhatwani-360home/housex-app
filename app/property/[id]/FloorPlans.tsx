"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { FloorPlan } from "@/lib/floorplan";

// Floor plans grouped by configuration (1 BHK / 2 BHK / Jodi …). When more than
// one config exists, buyers get filter tabs to jump to theirs. Each plan shows
// its label + carpet area and opens full-screen on tap.
export default function FloorPlans({ plans }: { plans: FloorPlan[] }) {
  const labels = Array.from(new Set(plans.map((p) => p.label).filter(Boolean)));
  const [active, setActive] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const shown = active ? plans.filter((p) => p.label === active) : plans;

  return (
    <>
      <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Floor plans</div>

      {labels.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2.5">
          <button onClick={() => setActive(null)} className={`shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold ${!active ? "border-hx-ink bg-hx-ink text-white" : "border-hx-line text-hx-slate"}`}>All</button>
          {labels.map((l) => (
            <button key={l} onClick={() => setActive(l)} className={`shrink-0 h-8 px-3 rounded-full border text-[12px] font-semibold ${active === l ? "border-hx-ink bg-hx-ink text-white" : "border-hx-line text-hx-slate"}`}>{l}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {shown.map((pl, i) => (
          <button key={i} onClick={() => setZoom(pl.url)} className="text-left rounded-xl border border-hx-line bg-hx-bg overflow-hidden">
            {(pl.label || pl.carpet) && (
              <div className="px-2.5 py-1.5 flex items-center justify-between gap-1 border-b border-hx-line bg-white">
                <span className="text-[12px] font-semibold text-hx-ink truncate">{pl.label || "Floor plan"}</span>
                {pl.carpet && <span className="num text-[11px] text-hx-muted shrink-0">{pl.carpet} sqft</span>}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pl.url} alt={pl.label || `Floor plan ${i + 1}`} className="w-full h-40 object-contain cursor-zoom-in" />
          </button>
        ))}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <button type="button" onClick={() => setZoom(null)} aria-label="Close" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white inline-flex items-center justify-center"><X className="w-5 h-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
