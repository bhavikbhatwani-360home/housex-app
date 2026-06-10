"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgePercent } from "lucide-react";

export default function SendOffer({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [valid, setValid] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const p = Number(price);
    if (!p || p <= 0) { setError("Enter a price in ₹ lakh."); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/developer/leads/${leadId}/offer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offerPriceLakh: p, note, validUntil: valid }),
      });
      if (res.ok) {
        setOpen(false); setPrice(""); setNote(""); setValid("");
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "Could not send.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-hx-ink text-hx-ink text-[13px] font-semibold hover:bg-hx-bg">
        <BadgePercent className="w-4 h-4 text-hx-red" /> Send rate offer
      </button>
    );
  }

  const inputCls = "h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50";
  return (
    <div className="rounded-xl border border-hx-line bg-white p-4">
      <div className="text-[13px] font-semibold mb-3 flex items-center gap-1.5"><BadgePercent className="w-4 h-4 text-hx-red" /> Send a rate offer to the buyer</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="Offer price (₹ lakh)" className={inputCls} />
        <input value={valid} onChange={(e) => setValid(e.target.value)} placeholder="Valid until (e.g. this week)" className={inputCls} />
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's included (e.g. covered parking + modular kitchen)" className={`mt-2.5 w-full ${inputCls}`} />
      {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={() => setOpen(false)} className="h-9 px-3.5 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold">Cancel</button>
        <button onClick={send} disabled={busy} className="h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-40">{busy ? "Sending…" : "Send offer"}</button>
      </div>
    </div>
  );
}
