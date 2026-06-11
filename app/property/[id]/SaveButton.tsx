"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export type SavedItem = { id: string; name: string; locality: string; bhk: string; priceMin: number; priceMax: number; image: string | null; savedAt: number };

const KEY = "hx:shortlist";

export function readShortlist(): SavedItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Heart toggle — the buyer's shortlist lives in localStorage (no account needed),
// shown on /saved so they can compare projects later.
export default function SaveButton({ item }: { item: Omit<SavedItem, "savedAt"> }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(readShortlist().some((s) => s.id === item.id)), [item.id]);

  const toggle = () => {
    try {
      const list = readShortlist();
      const next = saved ? list.filter((s) => s.id !== item.id) : [...list, { ...item, savedAt: Date.now() }];
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch {
      /* storage unavailable — ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
      className={`w-9 h-9 rounded-full border inline-flex items-center justify-center shrink-0 transition-colors ${
        saved ? "border-hx-red/40 bg-hx-red/5 text-hx-red" : "border-hx-line text-hx-slate hover:bg-hx-bg"
      }`}
    >
      <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
