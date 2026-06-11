"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Camera, ChevronLeft, ChevronRight, Images, X } from "lucide-react";

// Hero + thumbnail strip + full-screen swipeable viewer. Every photo is
// tappable; the viewer supports swipe, arrow keys and a "3 / 8" counter.
export default function PhotoGallery({ images, name }: { images: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const hero = images[0] || null;

  const prev = useCallback(() => setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setOpen((i) => (i === null ? i : (i + 1) % images.length)), [images.length]);

  // arrow keys / escape while the viewer is open
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  // simple swipe
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 48) prev();
    else if (dx < -48) next();
    setTouchX(null);
  };

  return (
    <>
      {/* hero */}
      <div
        className={`relative h-[210px] sm:h-[260px] ${hero ? "cursor-pointer" : ""}`}
        style={hero ? undefined : { backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 16px,#FAEFE7 16px 32px)" }}
        onClick={hero ? () => setOpen(0) : undefined}
      >
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-hx-muted text-[11px] font-mono">[ {name} · add photos ]</div>
        )}
        {/* legibility gradient behind the badges */}
        {hero && <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold"><BadgeCheck className="w-3 h-3" /> RERA verified</span>
        </div>
        {images.length > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 text-white text-[11px] font-semibold num">
            <Camera className="w-3 h-3" /> {images.length}
          </span>
        )}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(0); }}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/95 text-hx-ink text-[12px] font-semibold shadow-sm"
          >
            <Images className="w-3.5 h-3.5 text-hx-red" /> View all photos
          </button>
        )}
      </div>

      {/* thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pt-3">
          {images.slice(0, 8).map((src, i) => (
            <button key={i} type="button" onClick={() => setOpen(i)} className="relative shrink-0 rounded-lg overflow-hidden border border-hx-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-20 h-16 object-cover" />
              {i === 7 && images.length > 8 && (
                <span className="absolute inset-0 bg-black/55 text-white text-[12px] font-bold inline-flex items-center justify-center num">+{images.length - 8}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* full-screen viewer */}
      {open !== null && images[open] && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="h-14 shrink-0 flex items-center px-4 gap-3 text-white">
            <span className="num text-[13px] font-semibold">{open + 1} / {images.length}</span>
            <span className="text-[12px] text-white/60 truncate flex-1">{name}</span>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="w-9 h-9 rounded-full bg-white/10 inline-flex items-center justify-center"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 relative flex items-center justify-center px-2 pb-4 min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[open]} alt={`${name} photo ${open + 1}`} className="max-w-full max-h-full object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} aria-label="Previous photo" className="absolute left-2 w-10 h-10 rounded-full bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5" /></button>
                <button type="button" onClick={next} aria-label="Next photo" className="absolute right-2 w-10 h-10 rounded-full bg-white/10 text-white inline-flex items-center justify-center hover:bg-white/20"><ChevronRight className="w-5 h-5" /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="shrink-0 flex gap-1.5 overflow-x-auto no-scrollbar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {images.map((src, i) => (
                <button key={i} type="button" onClick={() => setOpen(i)} className={`shrink-0 rounded-md overflow-hidden border-2 ${i === open ? "border-hx-red" : "border-transparent opacity-60"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-14 h-11 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
