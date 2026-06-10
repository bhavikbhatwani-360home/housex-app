"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    // Native share sheet (WhatsApp, etc.) on mobile
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    // Desktop fallback — copy the link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={onShare}
      className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-hx-line text-[13px] font-medium text-hx-slate hover:bg-hx-bg shrink-0"
      aria-label="Share"
    >
      {copied ? <Check className="w-4 h-4 text-hx-success" /> : <Share2 className="w-4 h-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
