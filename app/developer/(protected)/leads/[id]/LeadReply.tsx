"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function LeadReply({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/developer/leads/${leadId}/reply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-hx-line bg-white p-2 shadow-hx">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        rows={1}
        placeholder="Reply to the buyer…  (appears in their Baba chat)"
        className="flex-1 resize-none bg-transparent outline-none text-[14px] leading-relaxed py-1.5 px-2 placeholder:text-hx-muted max-h-[160px]"
      />
      <button
        onClick={send}
        disabled={!text.trim() || busy}
        className="w-10 h-10 rounded-xl bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red disabled:opacity-30"
        aria-label="Send"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
