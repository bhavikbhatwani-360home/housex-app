"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, MapPin, ChevronDown, ArrowLeft, ArrowRight, BadgeCheck, House,
  PhoneOff, Compass, TrainFront, Trees, Dumbbell, Sun, KeyRound, Dog, Car,
  Building, ShieldCheck, Rocket, CalendarClock, CalendarRange, Telescope,
  Loader, Check, CheckCircle2, PartyPopper,
} from "lucide-react";

const TOTAL = 6;

const LOCALITIES = ["Virar West", "Virar East", "Nalasopara", "Vasai", "Mira Road", "Bhayandar", "Borivali"];
const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];

const PRIORITIES = [
  { icon: Compass, label: "East-facing" },
  { icon: TrainFront, label: "Near station" },
  { icon: Trees, label: "Kids' play area" },
  { icon: Dumbbell, label: "Gym & pool" },
  { icon: Sun, label: "Vastu compliant" },
  { icon: KeyRound, label: "Ready to move" },
  { icon: Dog, label: "Pet friendly" },
  { icon: Car, label: "Covered parking" },
  { icon: Building, label: "High floor" },
  { icon: ShieldCheck, label: "Gated society" },
];

const TIMELINE = [
  { icon: Rocket, title: "Right away", sub: "Ready-to-move, within 4 weeks", hot: true },
  { icon: CalendarClock, title: "1–3 months", sub: "Actively planning" },
  { icon: CalendarRange, title: "3–6 months", sub: "No rush, exploring options" },
  { icon: Telescope, title: "Just exploring", sub: "Curious about the market" },
];

const STEP_NAMES = ["Welcome", "Where", "Budget", "Priorities", "Timeline", "Matching"];
const SEARCH_SUBS = [
  "Scanning 4,210 homes in Virar West",
  "Checking RERA registrations",
  "Matching to your ₹60 L budget",
  "Ranking by east-facing + station",
];

function fmtCr(l: number) {
  if (l >= 100) {
    const cr = l / 100;
    return "₹" + (cr % 1 ? cr.toFixed(2) : cr) + " Cr";
  }
  return "₹" + l + " L";
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("English");
  const [localities, setLocalities] = useState<string[]>(["Virar West"]);
  const [bhk, setBhk] = useState("2 BHK");
  const [budget, setBudget] = useState(60);
  const [priorities, setPriorities] = useState<string[]>([
    "East-facing", "Near station", "Kids' play area", "Vastu compliant",
  ]);
  const [timeline, setTimeline] = useState(0);

  const [matchingDone, setMatchingDone] = useState(false);
  const [searchSub, setSearchSub] = useState(SEARCH_SUBS[0]);
  const bodyRef = useRef<HTMLElement>(null);

  const go = (s: number) => setStep(Math.max(0, Math.min(TOTAL - 1, s)));
  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // reset scroll on step change
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  // matching animation on step 5
  useEffect(() => {
    if (step !== 5) return;
    setMatchingDone(false);
    let i = 0;
    setSearchSub(SEARCH_SUBS[0]);
    const cycle = setInterval(() => {
      i++;
      if (i < SEARCH_SUBS.length) setSearchSub(SEARCH_SUBS[i]);
    }, 420);
    const done = setTimeout(() => {
      clearInterval(cycle);
      setMatchingDone(true);
    }, 1900);
    return () => {
      clearInterval(cycle);
      clearTimeout(done);
    };
  }, [step]);

  const ctaLabel =
    step === 0 ? "Let's go" : step === 4 ? "Find my home" : step === 5 ? "See all my matches" : "Continue";

  const onCta = () => {
    if (step === 5) {
      router.push("/chat");
      return;
    }
    go(step + 1);
  };

  return (
    <div className="min-h-dvh w-full flex md:items-center md:justify-center md:py-7">
      <div className="phone shrink-0">
        {/* header: back + progress + skip */}
        <header className="shrink-0 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
          <button
            onClick={() => go(step - 1)}
            className={`w-8 h-8 rounded-full bg-white border border-hx-line inline-flex items-center justify-center shadow-hx-sm transition-opacity ${
              step === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-hx-line overflow-hidden">
            <div
              className="h-full bg-hx-red rounded-full transition-all duration-300"
              style={{ width: `${Math.round((step / (TOTAL - 1)) * 100)}%` }}
            />
          </div>
          <button onClick={() => go(step + 1)} className="text-[12.5px] font-semibold text-hx-muted">Skip</button>
        </header>

        {/* body */}
        <main ref={bodyRef} className="flex-1 overflow-y-auto no-scrollbar px-5">
            {/* STEP 0 — WELCOME */}
            {step === 0 && (
              <section className="flex flex-col relative min-h-full">
                <div
                  className="absolute -top-[80px] -left-5 -right-5 h-[420px] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 50% 0%, rgba(224,57,67,0.13), transparent 58%), radial-gradient(95% 60% at 82% 4%, rgba(255,179,128,0.24), transparent 55%)",
                  }}
                />
                <div className="relative flex-1 flex flex-col items-center justify-center text-center pt-4">
                  <span className="relative inline-flex items-center justify-center mb-6">
                    <span
                      className="absolute -inset-7 rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(224,57,67,0.30), transparent 68%)", filter: "blur(12px)" }}
                    />
                    <span className="absolute inset-0 rounded-full bg-hx-red/25 ping-soft" />
                    <span className="relative w-[98px] h-[98px] rounded-full bg-white shadow-hx-lg ring-1 ring-hx-line inline-flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/housex-icon-circle.png" alt="HouseX" className="w-[80px] h-[80px]" />
                    </span>
                  </span>
                  <div className="font-deva text-[24px] font-bold leading-tight text-hx-red">नमस्ते 🙏</div>
                  <h2 className="mt-1 text-[28px] font-extrabold tracking-tight">I&apos;m Baba</h2>
                  <p className="mt-2 text-[14px] text-hx-slate leading-relaxed max-w-[280px]">
                    Your home-finding assistant. Tell me a few things and I&apos;ll surface homes that actually fit —{" "}
                    <span className="text-hx-ink font-semibold">no endless scrolling.</span>
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-hx-line shadow-hx-sm text-[11.5px] font-semibold whitespace-nowrap">
                      <BadgeCheck className="w-3.5 h-3.5 text-hx-success" />RERA-verified
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-hx-line shadow-hx-sm text-[11.5px] font-semibold whitespace-nowrap num">
                      <House className="w-3.5 h-3.5 text-hx-red" />4,210 homes
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-hx-line shadow-hx-sm text-[11.5px] font-semibold whitespace-nowrap">
                      <PhoneOff className="w-3.5 h-3.5 text-hx-slate" />No spam calls
                    </span>
                  </div>
                  <div className="mt-6 w-full">
                    <div className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted mb-2 text-left">Chat with me in</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "English", deva: false },
                        { label: "हिंदी", deva: true },
                        { label: "मराठी", deva: true },
                      ].map((l) => (
                        <button
                          key={l.label}
                          onClick={() => setLang(l.label)}
                          className={`opt rounded-2xl bg-white border border-hx-line py-3.5 font-bold ${
                            l.deva ? "text-[15px] font-deva" : "text-[14px]"
                          } ${lang === l.label ? "sel" : ""}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 1 — WHERE */}
            {step === 1 && (
              <section className="flex flex-col">
                <BabaBubble>Where are you looking to buy?</BabaBubble>
                <div className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted mb-2">City</div>
                <button className="opt sel w-full rounded-2xl bg-white border border-hx-line px-4 py-3 flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-[14px] font-semibold"><MapPin className="w-4 h-4 text-hx-red" />Mumbai (MMR)</span>
                  <ChevronDown className="w-4 h-4 text-hx-muted" />
                </button>
                <div className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted mb-2">
                  Localities <span className="text-hx-muted/70">· pick any</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {LOCALITIES.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => toggle(localities, setLocalities, loc)}
                      className={`opt rounded-full bg-white border border-hx-line px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap ${
                        localities.includes(loc) ? "sel" : ""
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <div className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted mb-2">Configuration</div>
                <div className="grid grid-cols-4 gap-2">
                  {BHKS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBhk(b)}
                      className={`opt seg rounded-xl bg-white border border-hx-line py-2.5 text-[13px] font-bold ${bhk === b ? "sel" : ""}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* STEP 2 — BUDGET */}
            {step === 2 && (
              <section className="flex flex-col">
                <BabaBubble>What&apos;s your budget? I&apos;ll only show homes you can actually get.</BabaBubble>
                <div className="rounded-2xl bg-white border border-hx-line shadow-hx p-4 mb-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted">Up to</div>
                      <div className="num text-[24px] font-extrabold tracking-tight">{fmtCr(budget)}</div>
                    </div>
                    <div className="text-right text-[11px] text-hx-muted leading-snug max-w-[140px]">
                      2 BHK in Virar West typically <span className="num font-semibold text-hx-slate">₹50–65 L</span>
                    </div>
                  </div>
                  <input
                    type="range" min={30} max={150} step={5} value={budget}
                    onChange={(e) => setBudget(+e.target.value)}
                    className="w-full mt-3 h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-hx-muted num mt-1"><span>₹30 L</span><span>₹1.5 Cr</span></div>
                </div>
                <div className="rounded-2xl bg-hx-bg border border-hx-line px-4 py-3.5 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-hx-success/10 text-hx-success inline-flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></span>
                  <p className="text-[12.5px] text-hx-slate leading-snug">
                    I&apos;ll only surface homes within this range. <span className="font-semibold text-hx-ink">No income or loan details needed</span> — your budget stays private.
                  </p>
                </div>
              </section>
            )}

            {/* STEP 3 — PRIORITIES */}
            {step === 3 && (
              <section className="flex flex-col">
                <BabaBubble>What matters most? I&apos;ll weight matches around these.</BabaBubble>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        onClick={() => toggle(priorities, setPriorities, p.label)}
                        className={`opt rounded-full bg-white border border-hx-line px-3 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                          priorities.includes(p.label) ? "sel" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />{p.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 rounded-2xl bg-hx-ink text-white p-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white/10 inline-flex items-center justify-center shrink-0"><Sparkles className="w-[18px] h-[18px]" /></span>
                  <p className="text-[12.5px] text-white/85 leading-snug">
                    The more you tell me, the sharper your <span className="font-bold text-white">match score</span>. You can change these anytime.
                  </p>
                </div>
              </section>
            )}

            {/* STEP 4 — TIMELINE */}
            {step === 4 && (
              <section className="flex flex-col">
                <BabaBubble>When are you hoping to move in?</BabaBubble>
                <div className="grid grid-cols-1 gap-2">
                  {TIMELINE.map((t, i) => {
                    const Icon = t.icon;
                    const sel = timeline === i;
                    return (
                      <button
                        key={t.title}
                        onClick={() => setTimeline(i)}
                        className={`opt w-full rounded-2xl bg-white border border-hx-line px-4 py-3.5 flex items-center gap-3 text-left ${sel ? "sel" : ""}`}
                      >
                        <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0 ${t.hot ? "bg-hx-red/10 text-hx-red" : "bg-hx-ink/5 text-hx-slate"}`}>
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[14px] font-bold">{t.title}</span>
                          <span className="block text-[11.5px] text-hx-muted">{t.sub}</span>
                        </span>
                        <CheckCircle2 className="tick w-5 h-5 text-hx-red shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* STEP 5 — MATCHING */}
            {step === 5 && (
              <section className="flex flex-col">
                {!matchingDone ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center pt-4">
                    <span className="relative inline-flex items-center justify-center mb-6">
                      <span className="absolute inset-0 rounded-full bg-hx-red/20 ping-soft" />
                      <span className="relative w-[84px] h-[84px] rounded-full bg-white shadow-hx-lg inline-flex items-center justify-center">
                        <Loader className="spin w-9 h-9 text-hx-red" />
                      </span>
                    </span>
                    <h2 className="text-[19px] font-extrabold tracking-tight">Finding your matches…</h2>
                    <p className="mt-1 text-[13px] text-hx-slate num">{searchSub}</p>
                    <div className="mt-4 flex flex-col gap-1.5 w-full max-w-[260px] text-left">
                      <div className="flex items-center gap-2 text-[12.5px] text-hx-slate"><Check className="w-4 h-4 text-hx-success" />Matched on your budget</div>
                      <div className="flex items-center gap-2 text-[12.5px] text-hx-slate"><Check className="w-4 h-4 text-hx-success" />Filtered to RERA-verified</div>
                      <div className="flex items-center gap-2 text-[12.5px] text-hx-muted">
                        <span className="w-4 h-4 inline-flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-hx-muted dot" /></span>Ranking by your priorities
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center pt-2">
                    <span className="w-[72px] h-[72px] rounded-full bg-hx-success/10 text-hx-success inline-flex items-center justify-center mb-4"><PartyPopper className="w-8 h-8" /></span>
                    <h2 className="text-[22px] font-extrabold tracking-tight">3 strong matches</h2>
                    <p className="mt-1 text-[13px] text-hx-slate leading-snug max-w-[270px]">
                      All east-facing 2 BHKs in Virar West, RERA-verified, within your {fmtCr(budget)} budget.
                    </p>
                    <div className="mt-5 w-full flex flex-col gap-2">
                      <MatchCard name="Greenvalley · 2 BHK East" meta="₹54 L · 800m from station" pct="92%" pctClass="bg-hx-red" stripe="repeating-linear-gradient(135deg,#F1E2D8 0 10px,#FAEFE7 10px 20px)" />
                      <MatchCard name="Sunrise Heights · 2 BHK" meta="₹56 L · 1.1km from station" pct="88%" pctClass="bg-hx-ink" stripe="repeating-linear-gradient(135deg,#DCE7F0 0 10px,#ECF2F7 10px 20px)" />
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="h-2" />
          </main>

          {/* bottom CTA */}
          <footer className="shrink-0 px-5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-hx-bg border-t border-hx-line">
            <button
              onClick={onCta}
              disabled={step === 5 && !matchingDone}
              className="w-full h-[52px] rounded-2xl bg-hx-red text-white shadow-hx-red inline-flex items-center justify-center gap-2 text-[15px] font-bold disabled:opacity-50 transition-opacity"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-[18px] h-[18px]" />
            </button>
          </footer>
      </div>
    </div>
  );
}

function BabaBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red"><Sparkles className="w-4 h-4" /></span>
      <div className="rounded-2xl rounded-tl-md bg-white border border-hx-line px-3.5 py-2.5 text-[14px] leading-snug shadow-hx-sm">{children}</div>
    </div>
  );
}

function MatchCard({ name, meta, pct, pctClass, stripe }: { name: string; meta: string; pct: string; pctClass: string; stripe: string }) {
  return (
    <div className="rounded-2xl bg-white border border-hx-line shadow-hx p-3 flex items-center gap-3 text-left">
      <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundImage: stripe }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-bold truncate">{name}</div>
        <div className="num text-[11.5px] text-hx-muted">{meta}</div>
      </div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[11px] font-bold shrink-0 ${pctClass}`}>
        <Sparkles className="w-3 h-3" />{pct}
      </span>
    </div>
  );
}
