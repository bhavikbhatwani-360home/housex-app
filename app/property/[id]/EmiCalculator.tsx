"use client";

import { useState } from "react";
import { IndianRupee } from "lucide-react";

// Interactive affordability: drag the tenure, EMI updates live. 7.5% p.a.,
// 90% loan-to-value (10% down) — a sensible default a buyer can feel.
export default function EmiCalculator({ priceLakh }: { priceLakh: number }) {
  const [years, setYears] = useState(20);
  const loan = priceLakh * 100000 * 0.9;
  const r = 0.075 / 12;
  const n = years * 12;
  const emi = Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  return (
    <div className="mt-4 rounded-2xl border border-hx-line p-4">
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><IndianRupee className="w-5 h-5" /></span>
        <div className="min-w-0">
          <div className="text-[12px] text-hx-muted">Estimated EMI · 90% loan · 7.5%</div>
          <div className="num text-[22px] font-extrabold tracking-tight leading-tight">
            ₹{emi.toLocaleString("en-IN")}<span className="text-[13px] font-medium text-hx-muted">/month</span>
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span className="text-hx-slate font-semibold">Loan tenure</span>
          <span className="num text-hx-ink font-bold">{years} yrs</span>
        </div>
        <input
          type="range" min={10} max={25} step={1} value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full accent-hx-red h-1.5 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-hx-muted num mt-1"><span>10</span><span>25 yrs</span></div>
      </div>
      <p className="mt-2 text-[11px] text-hx-muted">Indicative only — your actual EMI depends on the bank, down payment and rate.</p>
    </div>
  );
}
