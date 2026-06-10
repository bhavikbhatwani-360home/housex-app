"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export default function ClaimActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "approve" | "reject">("");
  const [msg, setMsg] = useState("");

  const act = async (action: "approve" | "reject") => {
    setBusy(action); setMsg("");
    try {
      const res = await fetch(`/api/admin/claims/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "approve" && data.hint) { setMsg(data.hint); }
        router.refresh();
      } else setMsg(data.error || "Failed.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button onClick={() => act("reject")} disabled={!!busy} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-hx-line text-hx-slate text-[12.5px] font-semibold hover:bg-hx-bg disabled:opacity-50">
          {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject
        </button>
        <button onClick={() => act("approve")} disabled={!!busy} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-hx-red text-white text-[12.5px] font-semibold shadow-hx-red disabled:opacity-50">
          {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve &amp; link
        </button>
      </div>
      {msg && <p className="text-[11px] text-hx-warning max-w-[220px] text-right leading-snug">{msg}</p>}
    </div>
  );
}
