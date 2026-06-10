"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/developer/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: "#eef1f5" }}>
      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-hx-line shadow-hx-lg p-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-9 h-9 rounded-[10px] bg-hx-red inline-flex items-center justify-center shadow-hx-red"><KeyRound className="w-4 h-4 text-white" /></span>
          <div className="text-[16px] font-semibold tracking-tight">Reset your password</div>
        </div>
        {sent ? (
          <p className="mt-3 text-[13.5px] text-hx-slate leading-relaxed">
            If an account exists for <strong>{email}</strong>, we&apos;ve emailed a reset link. It&apos;s valid for 1 hour — check your inbox (and spam).
          </p>
        ) : (
          <form onSubmit={submit}>
            <p className="text-[13px] text-hx-muted mb-4">Enter your work email and we&apos;ll send you a reset link.</p>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus
              className="w-full h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50"
            />
            {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
            <button type="submit" disabled={busy || !email} className="mt-4 w-full h-11 rounded-xl bg-hx-red text-white text-[14px] font-semibold shadow-hx-red disabled:opacity-40">
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-4 text-[13px] text-hx-muted text-center">
          <Link href="/developer/login" className="text-hx-red font-semibold">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
