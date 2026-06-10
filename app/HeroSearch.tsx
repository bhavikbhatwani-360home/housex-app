"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

/** Hero search box — type your ask here and it opens the chat with it already sent. */
export default function HeroSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();

  const go = () => {
    const txt = q.trim();
    router.push(txt ? `/chat?q=${encodeURIComponent(txt)}` : "/chat");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="mt-7 mx-auto max-w-[540px] flex items-center gap-2 bg-white rounded-2xl border border-hx-line p-2 pl-4 shadow-hx focus-within:border-hx-red/40 transition-colors"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="2 BHK in Virar West under ₹60 lakh, near a school…"
        aria-label="What home are you looking for?"
        className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-hx-ink placeholder:text-hx-muted"
      />
      <button
        type="submit"
        className="h-10 px-4 rounded-xl bg-hx-red text-white text-[13px] font-medium inline-flex items-center gap-1.5 shadow-hx-red shrink-0"
      >
        Ask HouseX AI <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
