"use client";

import { useState } from "react";
import { Flame, Tag, Lock, X, Check, Loader2, CheckCircle2, BadgeIndianRupee } from "lucide-react";

type Unit = { id: string; floor: number; facing: string; carpetSqft: number; priceLakh: number; listPriceLakh: number | null; tag: string | null };

export default function UnitsBlock({ propertyId, propertyName, units, offerNote }: { propertyId: string; propertyName: string; units: Unit[]; offerNote: string | null }) {
  const [lock, setLock] = useState<Unit | null>(null);
  const left = units.length;
  // the unit with the biggest discount gets the "best deal" flag
  const save = (u: Unit) => (u.listPriceLakh && u.listPriceLakh > u.priceLakh ? u.listPriceLakh - u.priceLakh : 0);
  const bestId = units.reduce<{ id: string; s: number }>((acc, u) => (save(u) > acc.s ? { id: u.id, s: save(u) } : acc), { id: "", s: 0 }).id;

  return (
    <>
      <div className="mt-6 flex items-center gap-2 mb-2">
        <span className="text-[12px] uppercase tracking-wider text-hx-muted font-medium">Pick your unit</span>
        {left > 0 && (
          <span className={`text-[10.5px] font-semibold rounded-full px-2 py-0.5 ${left <= 3 ? "bg-hx-red/10 text-hx-red" : "bg-hx-bg text-hx-slate"}`}>
            {left <= 3 ? `Only ${left} left` : `${left} available`}
          </span>
        )}
      </div>

      {offerNote && (
        <div className="mb-2.5 rounded-xl bg-hx-red/[0.06] border border-hx-red/20 px-3.5 py-2.5 flex items-center gap-2 text-[12.5px] text-hx-ink">
          <Flame className="w-4 h-4 text-hx-red shrink-0" /> <span className="font-medium">{offerNote}</span>
        </div>
      )}

      {units.length === 0 && <div className="rounded-xl border border-hx-line p-4 text-[13px] text-hx-muted">Contact the developer for availability.</div>}

      <div className="space-y-2.5">
        {units.map((u) => {
          const sv = save(u);
          const best = u.id === bestId && sv > 0;
          return (
            <div key={u.id} className={`rounded-2xl border bg-white p-3.5 ${best ? "border-hx-red/40" : "border-hx-line"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {best && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hx-red text-white text-[9.5px] font-bold uppercase tracking-wide"><Flame className="w-2.5 h-2.5" /> Best deal</span>}
                    <span className="text-[14px] font-bold">Floor {u.floor}</span>
                    <span className="text-[12px] text-hx-muted">· {u.facing}-facing · {u.carpetSqft} sqft</span>
                  </div>
                  {u.tag && <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-bg border border-hx-line text-[11px] text-hx-slate"><Tag className="w-3 h-3" /> {u.tag}</span>}
                </div>
                <div className="text-right shrink-0">
                  {sv > 0 && <div className="num text-[12px] text-hx-muted line-through">₹{u.listPriceLakh} L</div>}
                  <div className="num text-[19px] font-extrabold tracking-tight leading-tight">₹{u.priceLakh} L</div>
                  {sv > 0 && <div className="num text-[11px] font-bold text-hx-success">Save ₹{sv} L</div>}
                </div>
              </div>
              <button onClick={() => setLock(u)} className="mt-3 w-full h-10 rounded-xl bg-hx-red text-white text-[13px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4" /> {sv > 0 ? `Lock this price · save ₹${sv} L` : "Lock this price"}
              </button>
            </div>
          );
        })}
      </div>

      {lock && <LockSheet propertyId={propertyId} propertyName={propertyName} unit={lock} onClose={() => setLock(null)} />}
    </>
  );
}

function LockSheet({ propertyId, propertyName, unit, onClose }: { propertyId: string; propertyName: string; unit: Unit; onClose: () => void }) {
  const sv = unit.listPriceLakh && unit.listPriceLakh > unit.priceLakh ? unit.listPriceLakh - unit.priceLakh : 0;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const valid = name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10;

  const lockIt = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/lock-price", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, propertyName, floor: unit.floor, facing: unit.facing, tag: unit.tag, offerPriceLakh: unit.priceLakh, listPriceLakh: unit.listPriceLakh || 0, buyerName: name.trim(), buyerPhone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Could not lock the price.");
    } catch { setError("Something went wrong. Try again."); } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (verified) return lockIt();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone: phone.trim() }) });
      const data = await res.json();
      if (res.ok) { setOtpStage(true); setDevCode(data.devCode || null); }
      else setError(data.error || "Could not send code.");
    } catch { setError("Couldn't send the code. Try again."); } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone: phone.trim(), code: otp }) });
      const data = await res.json();
      if (res.ok) { setVerified(true); setOtpStage(false); await lockIt(); }
      else setError(data.error || "Wrong code.");
    } catch { setError("Couldn't verify. Try again."); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl border border-hx-line shadow-hx-lg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[16px] font-semibold tracking-tight">Lock this price</div>
            <div className="text-[12.5px] text-hx-muted">{propertyName} · Floor {unit.floor}{unit.tag ? ` · ${unit.tag}` : ""}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="py-4 text-center">
            <span className="w-14 h-14 rounded-2xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center mb-3"><CheckCircle2 className="w-7 h-7" /></span>
            <div className="text-[17px] font-semibold tracking-tight">Price locked 🔒</div>
            <p className="mt-1.5 text-[13px] text-hx-muted leading-relaxed max-w-xs mx-auto">We&apos;ve sent the developer your request for <strong className="text-hx-ink">₹{unit.priceLakh} L</strong> on Floor {unit.floor}{sv ? ` (₹${sv} L off)` : ""}. They&apos;ll call you on {phone} to confirm — usually fast.</p>
            <button onClick={onClose} className="mt-4 h-11 px-6 rounded-xl bg-hx-ink text-white text-[13.5px] font-semibold">Done</button>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-2xl bg-hx-bg border border-hx-line p-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-hx-red/10 text-hx-red inline-flex items-center justify-center shrink-0"><BadgeIndianRupee className="w-5 h-5" /></span>
              <div className="flex-1">
                {sv > 0 && <div className="num text-[12px] text-hx-muted line-through">₹{unit.listPriceLakh} L</div>}
                <div className="num text-[20px] font-extrabold tracking-tight leading-tight">₹{unit.priceLakh} L {sv > 0 && <span className="text-[12px] font-bold text-hx-success">· save ₹{sv} L</span>}</div>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-hx-slate leading-relaxed">Enter your details — we&apos;ll verify your number and send this offer straight to the developer. No brokerage, no spam.</p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" disabled={otpStage} className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 disabled:opacity-60" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" disabled={otpStage} className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 disabled:opacity-60" />
            </div>

            {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}

            {otpStage ? (
              <div className="mt-4 rounded-2xl border border-hx-red/30 bg-hx-red/[0.03] p-4">
                <div className="text-[13px] font-semibold">Verify your phone</div>
                <p className="text-[12px] text-hx-muted mt-0.5">Enter the 6-digit code sent to {phone}.</p>
                {devCode && <p className="mt-1.5 text-[12px] text-hx-warning">Test mode — your code is <span className="num font-bold">{devCode}</span>.</p>}
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="------" className="mt-2.5 w-full h-12 px-3.5 rounded-xl border border-hx-line bg-white text-center text-[20px] tracking-[0.4em] num outline-none focus:border-hx-red/50" />
                <button onClick={verifyOtp} disabled={otp.length !== 6 || busy} className="mt-3 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Verify &amp; lock price
                </button>
                <button onClick={() => { setOtpStage(false); setOtp(""); setError(""); }} className="mt-2 w-full text-[12.5px] font-semibold text-hx-slate">Change number</button>
              </div>
            ) : (
              <>
                <button onClick={confirm} disabled={!valid || busy} className="mt-4 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40">
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Lock ₹{unit.priceLakh} L
                </button>
                <p className="mt-2 text-center text-[11px] text-hx-muted">Your number is shared only with this developer — never with brokers.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
