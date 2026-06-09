"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DeveloperSignup() {
  const router = useRouter();
  const [f, setF] = useState({ company: "", name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/developer/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (res.ok) router.push("/developer");
      else setError(data.error || "Could not create account.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-8" style={{ background: "#eef1f5" }}>
      <form onSubmit={submit} className="w-full max-w-[400px] bg-white rounded-2xl border border-hx-line shadow-hx-lg p-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-9 h-9 rounded-[10px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[66%] h-[66%] object-contain" />
          </span>
          <div className="text-[16px] font-semibold tracking-tight">Create your developer account</div>
        </div>
        <p className="text-[13px] text-hx-muted mb-5">List your projects and get qualified buyer leads from Baba.</p>

        <Field label="Company / builder name" value={f.company} onChange={set("company")} placeholder="Square Homes" autoFocus />
        <Field label="Your name" value={f.name} onChange={set("name")} placeholder="Rohit Patil" />
        <Field label="Work email" type="email" value={f.email} onChange={set("email")} placeholder="you@company.com" />
        <Field label="Phone (optional)" value={f.phone} onChange={set("phone")} placeholder="+91 …" />
        <Field label="Password" type="password" value={f.password} onChange={set("password")} placeholder="At least 6 characters" />

        {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
        <button type="submit" disabled={busy} className="mt-4 w-full h-11 rounded-xl bg-hx-red text-white text-[14px] font-semibold shadow-hx-red disabled:opacity-40">
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="mt-4 text-[13px] text-hx-muted text-center">
          Already have an account? <Link href="/developer/login" className="text-hx-red font-semibold">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block mb-3">
      <span className="text-[12px] font-medium text-hx-slate mb-1 block">{label}</span>
      <input {...props} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
    </label>
  );
}
