"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/developer/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) router.push("/developer");
      else setError(data.error || "Could not reset.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: "#eef1f5" }}>
      <form onSubmit={submit} className="w-full max-w-[380px] bg-white rounded-2xl border border-hx-line shadow-hx-lg p-7">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-9 h-9 rounded-[10px] bg-hx-red inline-flex items-center justify-center shadow-hx-red"><KeyRound className="w-4 h-4 text-white" /></span>
          <div className="text-[16px] font-semibold tracking-tight">Set a new password</div>
        </div>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 6 characters)" autoFocus
          className="w-full h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50"
        />
        {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
        <button type="submit" disabled={busy || password.length < 6} className="mt-4 w-full h-11 rounded-xl bg-hx-red text-white text-[14px] font-semibold shadow-hx-red disabled:opacity-40">
          {busy ? "Saving…" : "Save & sign in"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
