"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, CalendarPlus, BadgePercent, X, Check, Building2, Video, Loader2, CheckCircle2 } from "lucide-react";

const SLOTS = ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM", "6:00 PM"];

function nextDays(n: number) {
  const out: { label: string; sub: string; full: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      sub: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      full: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
    });
  }
  return out;
}

export default function PropertyActions({ propertyId, propertyName, locality, priceMin }: { propertyId: string; propertyName: string; locality: string; priceMin: number }) {
  const [sheet, setSheet] = useState<null | "visit" | "offer">(null);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hx-line px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Link href="/chat" className="h-11 px-3.5 rounded-xl bg-white border border-hx-line text-[12.5px] font-semibold text-hx-ink inline-flex items-center justify-center gap-1.5 shrink-0">
            <MessageSquare className="w-4 h-4 text-hx-red" /> Ask AI
          </Link>
          <button onClick={() => setSheet("visit")} className="h-11 flex-1 rounded-xl bg-white border border-hx-line text-[13px] font-semibold text-hx-ink inline-flex items-center justify-center gap-1.5">
            <CalendarPlus className="w-4 h-4" /> Book a visit
          </button>
          <button onClick={() => setSheet("offer")} className="h-11 flex-1 rounded-xl bg-hx-red text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-hx-red">
            <BadgePercent className="w-4 h-4" /> Request offer
          </button>
        </div>
      </div>

      {sheet === "visit" && <BookingSheet propertyId={propertyId} propertyName={propertyName} locality={locality} onClose={() => setSheet(null)} />}
      {sheet === "offer" && <OfferSheet propertyId={propertyId} propertyName={propertyName} priceMin={priceMin} onClose={() => setSheet(null)} />}
    </>
  );
}

function SheetShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl border border-hx-line shadow-hx-lg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[16px] font-semibold tracking-tight">{title}</div>
            <div className="text-[12.5px] text-hx-muted">{subtitle}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Done({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <div className="py-4 text-center">
      <span className="w-14 h-14 rounded-2xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center mb-3"><CheckCircle2 className="w-7 h-7" /></span>
      <div className="text-[17px] font-semibold tracking-tight">{title}</div>
      <p className="mt-1.5 text-[13px] text-hx-muted leading-relaxed max-w-xs mx-auto">{body}</p>
      <button onClick={onClose} className="mt-4 h-11 px-6 rounded-xl bg-hx-ink text-white text-[13.5px] font-semibold">Done</button>
    </div>
  );
}

function BookingSheet({ propertyId, propertyName, locality, onClose }: { propertyId: string; propertyName: string; locality: string; onClose: () => void }) {
  const days = nextDays(7);
  const [dateIdx, setDateIdx] = useState(1);
  const [slot, setSlot] = useState(SLOTS[1]);
  const [mode, setMode] = useState("In-person");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const valid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, propertyName, date: days[dateIdx].full, slot, mode, buyerName: name.trim(), buyerPhone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Could not book.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <SheetShell title="Book a site visit" subtitle={`${propertyName} · ${locality}`} onClose={onClose}>
        <Done title="Visit booked 🎉" body={`${propertyName} · ${days[dateIdx].full} · ${slot}. The developer will confirm shortly and reach you on ${phone}.`} onClose={onClose} />
      </SheetShell>
    );

  return (
    <SheetShell title="Book a site visit" subtitle={`${propertyName} · ${locality}`} onClose={onClose}>
      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Pick a day</div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {days.map((d, i) => (
          <button key={i} onClick={() => setDateIdx(i)} className={`shrink-0 w-[64px] rounded-xl border px-2 py-2 text-center ${dateIdx === i ? "border-hx-red bg-hx-red/5" : "border-hx-line bg-white"}`}>
            <div className={`text-[12px] font-semibold ${dateIdx === i ? "text-hx-red" : "text-hx-ink"}`}>{d.label}</div>
            <div className="text-[10.5px] text-hx-muted num">{d.sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Time</div>
      <div className="flex flex-wrap gap-2">
        {SLOTS.map((s) => (
          <button key={s} onClick={() => setSlot(s)} className={`px-3 h-9 rounded-lg border text-[13px] font-medium num ${slot === s ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}>{s}</button>
        ))}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Visit type</div>
      <div className="grid grid-cols-2 gap-2">
        {[{ k: "In-person", icon: Building2 }, { k: "Video", icon: Video }].map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.k} onClick={() => setMode(m.k)} className={`h-11 rounded-xl border inline-flex items-center justify-center gap-2 text-[13.5px] font-medium ${mode === m.k ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}><Icon className="w-4 h-4" /> {m.k}</button>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Your details — so the developer can confirm</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
      </div>

      {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}

      <button onClick={submit} disabled={!valid || busy} className="mt-4 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Confirm visit
      </button>
      <p className="mt-2 text-center text-[11px] text-hx-muted">Your number is shared only with this developer — never with brokers.</p>
    </SheetShell>
  );
}

function OfferSheet({ propertyId, propertyName, priceMin, onClose }: { propertyId: string; propertyName: string; priceMin: number; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const valid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/request-offer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, propertyName, buyerName: name.trim(), buyerPhone: phone.trim(), targetPriceLakh: target ? Number(target) : 0, note: note.trim() }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Could not send.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <SheetShell title="Request a price" subtitle={propertyName} onClose={onClose}>
        <Done title="Request sent 💰" body={`We've asked the developer of ${propertyName} for their best price. They'll reach you on ${phone} — usually fast.`} onClose={onClose} />
      </SheetShell>
    );

  return (
    <SheetShell title="Request a price" subtitle={propertyName} onClose={onClose}>
      <p className="mt-3 text-[13px] text-hx-slate leading-relaxed">Tell the developer you&apos;re interested and what works for you. No brokerage, no spam — they reply directly.</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
      </div>

      <div className="mt-3">
        <span className="text-[12px] font-medium text-hx-slate mb-1 block">Your target price (optional)</span>
        <div className="flex h-11 rounded-xl border border-hx-line bg-hx-bg overflow-hidden">
          <span className="inline-flex items-center px-3 text-[14px] font-semibold text-hx-muted border-r border-hx-line">₹</span>
          <input value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder={priceMin > 0 ? `${priceMin}` : "e.g. 52"} className="flex-1 px-3 text-[14px] num outline-none bg-transparent" />
          <span className="inline-flex items-center px-3 text-[12px] text-hx-muted">lakh</span>
        </div>
      </div>

      <label className="block mt-3">
        <span className="text-[12px] font-medium text-hx-slate mb-1 block">Anything to add? (optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. ready to book this month if the price works" className="w-full px-3 py-2 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 resize-none" />
      </label>

      {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}

      <button onClick={submit} disabled={!valid || busy} className="mt-4 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgePercent className="w-5 h-5" />} Send to developer
      </button>
      <p className="mt-2 text-center text-[11px] text-hx-muted">Your number is shared only with this developer — never with brokers.</p>
    </SheetShell>
  );
}
