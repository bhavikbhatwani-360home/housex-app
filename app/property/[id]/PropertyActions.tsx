"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, CalendarPlus, BadgePercent, X, Check, Video, Loader2, CheckCircle2, Sunrise, Sun, Sunset, Footprints, Users, User, Briefcase, Navigation } from "lucide-react";

const TIME_GROUPS = [
  { label: "Morning", icon: Sunrise, slots: ["9:00 AM", "10:00 AM", "11:00 AM"] },
  { label: "Afternoon", icon: Sun, slots: ["12:30 PM", "2:00 PM", "3:30 PM"] },
  { label: "Evening", icon: Sunset, slots: ["5:00 PM", "6:00 PM", "7:00 PM"] },
];
const WHO_OPTS = [
  { val: "Just me", icon: User },
  { val: "With family", icon: Users },
  { val: "With an advisor", icon: Briefcase },
];

function nextDays(n: number) {
  const out: { label: string; sub: string; full: string; date: Date }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      sub: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      full: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
      date: d,
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

function parseTime(slot: string) {
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return { h: 11, min: 0 };
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return { h, min };
}
function icsStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

const MODES = [
  { k: "In-person", icon: Footprints, title: "In-person visit", desc: "A rep shows you the flat & society · ~45 min", badge: "" },
  { k: "Video", icon: Video, title: "Live video walkthrough", desc: "A rep walks you through on a video call · ~20 min", badge: "No travel" },
];

function BookingSheet({ propertyId, propertyName, locality, onClose }: { propertyId: string; propertyName: string; locality: string; onClose: () => void }) {
  const days = nextDays(7);
  const [dateIdx, setDateIdx] = useState(1);
  const [slot, setSlot] = useState("10:00 AM");
  const [mode, setMode] = useState("In-person");
  const [who, setWho] = useState("Just me");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ref, setRef] = useState<string | null>(null);
  // phone verification
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const valid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;
  const day = days[dateIdx];

  const book = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, propertyName, date: day.full, slot, mode, who, note: note.trim(), buyerName: name.trim(), buyerPhone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) setRef(data.ref || "HX-VISIT");
      else setError(data.error || "Could not book.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Confirm → verify the phone (OTP) the first time, then book.
  const confirm = async () => {
    if (verified) return book();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setOtpStage(true); setDevCode(data.devCode || null); }
      else setError(data.error || "Could not send code.");
    } catch {
      setError("Couldn't send the code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      });
      const data = await res.json();
      if (res.ok) { setVerified(true); setOtpStage(false); await book(); }
      else setError(data.error || "Wrong code.");
    } catch {
      setError("Couldn't verify. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const addToCalendar = () => {
    const { h, min } = parseTime(slot);
    const start = new Date(day.date);
    start.setHours(h, min, 0, 0);
    const end = new Date(start.getTime() + (mode === "Video" ? 20 : 45) * 60000);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HouseX//Visit//EN", "BEGIN:VEVENT",
      `UID:${ref}@housex.ai`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:Site visit — ${propertyName}`, `LOCATION:${propertyName}, ${locality}`,
      `DESCRIPTION:HouseX ${mode.toLowerCase()} visit. Booking ${ref}. Show this at the gate.`,
      "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Site visit in 2 hours", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = `housex-visit-${ref}.ics`; a.click();
    URL.revokeObjectURL(url);
  };
  const directions = `https://maps.google.com/maps?q=${encodeURIComponent(`${propertyName}, ${locality}`)}`;

  if (ref)
    return (
      <SheetShell title="Visit confirmed 🎉" subtitle={`${propertyName} · ${locality}`} onClose={onClose}>
        {/* gate pass */}
        <div className="mt-3 rounded-2xl bg-hx-ink text-white overflow-hidden">
          <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-white/60 font-semibold">Site visit pass</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-success/20 text-hx-success text-[10px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-hx-success" /> Confirmed</span>
          </div>
          <div className="px-4 pb-3">
            <div className="text-[17px] font-extrabold tracking-tight">{propertyName}</div>
            <div className="text-[12px] text-white/60">{locality}</div>
          </div>
          <div className="border-t border-dashed border-white/20 mx-4" />
          <div className="px-4 py-3 grid grid-cols-2 gap-y-3 gap-x-2">
            <Field label="Date" value={day.full} />
            <Field label="Time" value={slot} />
            <Field label="Mode" value={mode === "Video" ? "Video call" : "In-person"} />
            <Field label="Booking ID" value={ref} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={addToCalendar} className="h-11 rounded-xl bg-white border border-hx-line inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold"><CalendarPlus className="w-4 h-4" /> Add to calendar</button>
          <a href={directions} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-white border border-hx-line inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold"><Navigation className="w-4 h-4" /> Directions</a>
        </div>
        <p className="mt-3 text-center text-[12px] text-hx-muted leading-relaxed">The developer will confirm the rep and reach you on <span className="font-semibold text-hx-ink">{phone}</span>. Show this pass at the gate.</p>
        <button onClick={onClose} className="mt-3 w-full h-11 rounded-xl bg-hx-ink text-white text-[13.5px] font-semibold">Done</button>
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

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Choose a time</div>
      <div className="space-y-3">
        {TIME_GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.label}>
              <div className="text-[11px] font-semibold text-hx-slate mb-1.5 flex items-center gap-1"><Icon className="w-3.5 h-3.5 text-hx-warning" /> {g.label}</div>
              <div className="grid grid-cols-3 gap-2">
                {g.slots.map((s) => (
                  <button key={s} onClick={() => setSlot(s)} className={`h-9 rounded-lg border text-[13px] font-medium num ${slot === s ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}>{s}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">How would you like to visit?</div>
      <div className="grid grid-cols-1 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const on = mode === m.k;
          return (
            <button key={m.k} onClick={() => setMode(m.k)} className={`w-full rounded-2xl border p-3.5 text-left flex items-center gap-3 ${on ? "border-hx-red bg-hx-red/5" : "border-hx-line bg-white"}`}>
              <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 ${on ? "bg-hx-red/10 text-hx-red" : "bg-hx-ink/5 text-hx-slate"}`}><Icon className="w-5 h-5" /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold flex items-center gap-1.5">{m.title}{m.badge && <span className="inline-flex items-center px-1.5 py-[1px] rounded bg-hx-success/10 text-hx-success text-[9px] font-bold uppercase">{m.badge}</span>}</div>
                <div className="text-[12px] text-hx-muted">{m.desc}</div>
              </div>
              {on && <Check className="w-5 h-5 text-hx-red shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Who&apos;s coming?</div>
      <div className="grid grid-cols-3 gap-2">
        {WHO_OPTS.map((w) => {
          const Icon = w.icon;
          const on = who === w.val;
          return (
            <button key={w.val} onClick={() => setWho(w.val)} className={`rounded-xl border px-2 py-2.5 text-center ${on ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}>
              <Icon className="w-4 h-4 mx-auto mb-1" />
              <span className="text-[11.5px] font-semibold leading-tight">{w.val}</span>
            </button>
          );
        })}
      </div>

      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything for the rep to prepare? (optional)" className="mt-3 w-full px-3 py-2 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 resize-none" />

      <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Your details — so the developer can confirm</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" disabled={otpStage} className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 disabled:opacity-60" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" disabled={otpStage} className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 disabled:opacity-60" />
      </div>

      {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}

      {otpStage ? (
        <div className="mt-4 rounded-2xl border border-hx-red/30 bg-hx-red/[0.03] p-4">
          <div className="text-[13px] font-semibold">Verify your phone</div>
          <p className="text-[12px] text-hx-muted mt-0.5">Enter the 6-digit code sent to {phone}.</p>
          {devCode && <p className="mt-1.5 text-[12px] text-hx-warning">Test mode — your code is <span className="num font-bold">{devCode}</span> (SMS goes live once a provider is set up).</p>}
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric" placeholder="------"
            className="mt-2.5 w-full h-12 px-3.5 rounded-xl border border-hx-line bg-white text-center text-[20px] tracking-[0.4em] num outline-none focus:border-hx-red/50"
          />
          <button onClick={verifyOtp} disabled={otp.length !== 6 || busy} className="mt-3 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Verify &amp; book
          </button>
          <button onClick={() => { setOtpStage(false); setOtp(""); setError(""); }} className="mt-2 w-full text-[12.5px] font-semibold text-hx-slate">Change number</button>
        </div>
      ) : (
        <>
          <button onClick={confirm} disabled={!valid || busy} className="mt-4 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Confirm visit
          </button>
          <p className="mt-2 text-center text-[11px] text-hx-muted">We&apos;ll text a code to verify your number — shared only with this developer, never brokers.</p>
        </>
      )}
    </SheetShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="text-[13px] font-bold num">{value}</div>
    </div>
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
