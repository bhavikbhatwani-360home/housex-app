"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock, FileEdit, Check, Loader2 } from "lucide-react";

const META: Record<string, { cls: string; icon: typeof BadgeCheck }> = {
  Live: { cls: "bg-hx-success/10 text-hx-success", icon: BadgeCheck },
  Pending: { cls: "bg-hx-warning/10 text-hx-warning", icon: Clock },
  Draft: { cls: "bg-hx-bg text-hx-slate", icon: FileEdit },
};

/** Status badge + one-click "Approve → Live" for Draft/Pending listings. */
export default function StatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [cur, setCur] = useState(status);
  const [busy, setBusy] = useState(false);
  const m = META[cur] || META.Draft;
  const Icon = m.icon;

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "Live" }),
      });
      if (res.ok) {
        setCur("Live");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${m.cls}`}>
        <Icon className="w-3 h-3" /> {cur}
      </span>
      {cur !== "Live" && (
        <button
          onClick={approve}
          disabled={busy}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-hx-red text-white text-[11.5px] font-semibold shadow-hx-red disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
        </button>
      )}
    </div>
  );
}
