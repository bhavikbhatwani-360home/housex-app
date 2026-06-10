"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ClaimForm({ propertyId, projectName, developer }: { propertyId: string; projectName: string; developer: string }) {
  const [f, setF] = useState({ name: "", company: developer || "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ propertyId, ...f }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || "Could not submit.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-hx-line bg-white p-6 text-center">
        <span className="w-14 h-14 rounded-2xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center mb-4"><CheckCircle2 className="w-7 h-7" /></span>
        <h2 className="text-[20px] font-semibold tracking-tight">Claim received 🎉</h2>
        <p className="mt-2 text-[14px] text-hx-muted leading-relaxed max-w-sm mx-auto">
          Thanks! Our team will verify you&apos;re the developer of <strong>{projectName}</strong> and get in touch shortly. Once approved, every buyer lead on this project routes straight to you.
        </p>
        <Link href="/pricing" className="mt-5 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-hx-red text-white text-[13.5px] font-semibold shadow-hx-red">
          See what developers get
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-hx-line bg-white p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Your name" value={f.name} onChange={set("name")} placeholder="Rahul Shah" required />
        <Field label="Company" value={f.company} onChange={set("company")} placeholder="Developer / builder name" required />
        <Field label="Work email" value={f.email} onChange={set("email")} type="email" placeholder="you@company.com" required />
        <Field label="Phone" value={f.phone} onChange={set("phone")} type="tel" placeholder="10-digit mobile" required />
      </div>
      <label className="block mt-3">
        <span className="text-[12px] font-medium text-hx-slate mb-1 block">Anything to add? (optional)</span>
        <textarea value={f.message} onChange={set("message")} rows={3} placeholder="e.g. I'm the sales head for this project."
          className="w-full px-3 py-2 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50 resize-none" />
      </label>

      {error && <div className="mt-3 flex items-start gap-2 text-[13px] text-hx-danger"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}

      <button disabled={busy} className="mt-4 w-full h-12 rounded-xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-50">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgeCheck className="w-5 h-5" />}
        {busy ? "Submitting…" : "Claim this listing"}
      </button>
      <p className="mt-2 text-center text-[11.5px] text-hx-muted">Free. We verify ownership before any leads are shared.</p>
    </form>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-hx-slate mb-1 block">{label}</span>
      <input {...props} className="w-full h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
    </label>
  );
}
