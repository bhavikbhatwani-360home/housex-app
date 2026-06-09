"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) router.push("/admin/leads");
      else setError(data.error || "Login failed.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: "#eef1f5" }}>
      <form onSubmit={submit} className="w-full max-w-[360px] bg-white rounded-2xl border border-hx-line shadow-hx-lg p-7">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-9 h-9 rounded-[10px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[66%] h-[66%] object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">HouseX Console</div>
            <div className="text-[11px] text-hx-muted">Operator access</div>
          </div>
        </div>
        <label className="text-[12px] font-medium text-hx-slate mb-1.5 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50"
          placeholder="Enter operator password"
        />
        {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 w-full h-11 rounded-xl bg-hx-red text-white text-[14px] font-semibold shadow-hx-red disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
