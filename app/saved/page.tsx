"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Trash2 } from "lucide-react";
import { readShortlist, type SavedItem } from "../property/[id]/SaveButton";

// The buyer's shortlist — saved hearts from property pages, kept on-device.
export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  useEffect(() => setItems(readShortlist().sort((a, b) => b.savedAt - a.savedAt)), []);

  const remove = (id: string) => {
    const next = (items ?? []).filter((s) => s.id !== id);
    try { localStorage.setItem("hx:shortlist", JSON.stringify(next)); } catch {}
    setItems(next);
  };

  return (
    <div className="min-h-dvh bg-white text-hx-ink">
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur border-b border-hx-line flex items-center px-4 gap-3">
        <Link href="/" className="w-9 h-9 rounded-full border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="text-[15px] font-semibold tracking-tight flex items-center gap-1.5"><Heart className="w-4 h-4 text-hx-red fill-current" /> Saved homes</div>
        {items && items.length > 0 && <span className="num text-[12px] text-hx-muted">· {items.length}</span>}
      </header>

      <div className="max-w-2xl mx-auto px-5 py-5">
        {items === null ? null : items.length === 0 ? (
          <div className="py-16 text-center">
            <span className="w-14 h-14 rounded-2xl bg-hx-bg inline-flex items-center justify-center mb-3"><Heart className="w-6 h-6 text-hx-muted" /></span>
            <div className="text-[16px] font-semibold">Nothing saved yet</div>
            <p className="mt-1 text-[13px] text-hx-muted max-w-xs mx-auto">Tap the ♥ on any property to keep it here while you compare.</p>
            <Link href="/chat" className="mt-4 inline-flex h-11 px-5 rounded-xl bg-hx-red text-white text-[13.5px] font-semibold items-center shadow-hx-red">Find homes</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => {
              const range = s.priceMin === s.priceMax ? `₹${s.priceMin} L` : `₹${s.priceMin}–${s.priceMax} L`;
              return (
                <div key={s.id} className="rounded-2xl border border-hx-line overflow-hidden flex">
                  <Link href={`/property/${s.id}`} className="flex flex-1 min-w-0 hover:bg-hx-bg/40">
                    <div className="w-[110px] h-[92px] shrink-0 bg-hx-bg">
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 12px,#FAEFE7 12px 24px)" }} />
                      )}
                    </div>
                    <div className="p-3 min-w-0 flex-1">
                      <div className="text-[14.5px] font-semibold truncate">{s.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-hx-muted truncate"><MapPin className="w-3 h-3 shrink-0" /> {s.locality}</div>
                      <div className="mt-1.5 flex items-center gap-2 text-[13px]">
                        <span className="num font-bold">{range}</span>
                        <span className="text-hx-muted">·</span>
                        <span className="text-hx-slate">{s.bhk}</span>
                      </div>
                    </div>
                  </Link>
                  <button type="button" onClick={() => remove(s.id)} aria-label="Remove" className="w-11 shrink-0 inline-flex items-center justify-center text-hx-muted hover:text-hx-danger border-l border-hx-line">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
