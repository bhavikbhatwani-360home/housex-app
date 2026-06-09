import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata = { title: "HouseX — Pricing for developers" };

const TIERS = [
  {
    name: "Starter", price: "₹1L", per: "/quarter", tag: "For first-time projects",
    features: ["100 qualified leads / quarter", "3 projects", "2 team logins", "Baba AI lead matching", "Site-visit booking", "₹999 token bookings"],
    cta: "Start free trial", highlight: false,
  },
  {
    name: "Growth", price: "₹3L", per: "/quarter", tag: "Most popular",
    features: ["300 qualified leads / quarter", "10 projects", "5 team logins", "Priority Baba placement", "AI replies in Hindi/Marathi/English", "Everything in Starter"],
    cta: "Choose Growth", highlight: true,
  },
  {
    name: "Scale", price: "₹5L", per: "/quarter", tag: "For large builders",
    features: ["Unlimited leads", "Unlimited projects", "Unlimited logins", "Dedicated account manager", "Pinned Baba in your cities", "Everything in Growth"],
    cta: "Talk to sales", highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-dvh" style={{ background: "#fafafa" }}>
      {/* nav */}
      <nav className="h-16 bg-white border-b border-hx-line px-5 sm:px-8 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[9px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[66%] h-[66%] object-contain" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">HouseX</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/developer/login" className="h-9 px-3.5 rounded-lg text-[13.5px] font-medium text-hx-slate hover:bg-hx-bg inline-flex items-center">Sign in</Link>
          <Link href="/developer/signup" className="h-9 px-3.5 rounded-lg bg-hx-red text-white text-[13.5px] font-semibold inline-flex items-center shadow-hx-red">Get started</Link>
        </div>
      </nav>

      {/* hero */}
      <div className="text-center px-5 pt-14 pb-8 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hx-red/8 text-hx-red text-[12px] font-semibold">Pricing · India</span>
        <h1 className="mt-4 text-[34px] sm:text-[40px] font-bold tracking-tight leading-tight">
          Pay only for the leads <span className="text-hx-red">you can close.</span>
        </h1>
        <p className="mt-3 text-[15px] text-hx-slate leading-relaxed">
          No per-listing fees. No broker commission. Just qualified, RERA-aware buyers from Baba — billed quarterly.
        </p>
      </div>

      {/* tiers */}
      <div className="px-5 pb-16 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
        {TIERS.map((t) => (
          <div key={t.name} className={`rounded-2xl bg-white p-6 ${t.highlight ? "border-2 border-hx-red shadow-hx-lg md:-mt-2" : "border border-hx-line shadow-hx"}`}>
            {t.highlight && <div className="text-[11px] font-bold uppercase tracking-wider text-hx-red mb-2">★ {t.tag}</div>}
            {!t.highlight && <div className="text-[12px] text-hx-muted mb-2">{t.tag}</div>}
            <div className="text-[18px] font-semibold tracking-tight">{t.name}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="num text-[34px] font-extrabold tracking-tight">{t.price}</span>
              <span className="text-[13px] text-hx-muted">{t.per}</span>
            </div>
            <ul className="mt-5 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13.5px] text-hx-slate">
                  <Check className="w-4 h-4 text-hx-success shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/developer/signup" className={`mt-6 w-full h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 ${t.highlight ? "bg-hx-red text-white shadow-hx-red" : "bg-white border border-hx-line text-hx-ink hover:bg-hx-bg"}`}>
              {t.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center pb-16 px-5">
        <p className="text-[13px] text-hx-muted">All plans: cancel any quarter · GST extra at 18% · RERA + DPDPA compliant</p>
      </div>
    </div>
  );
}
