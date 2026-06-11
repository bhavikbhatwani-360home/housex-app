import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles, MessageCircle, Rotate3D, BadgePercent, ArrowRight, CheckCircle2,
  PhoneOff, BadgeCheck, Smartphone,
} from "lucide-react";
import HeroSearch from "./HeroSearch";
import { prisma } from "@/lib/db";
import { STAGES, STAGE_BADGE } from "@/lib/stage";

export const metadata: Metadata = {
  title: "HouseX — Stop scrolling listings. Just talk to HouseX AI.",
  description:
    "AI-powered home search for India. Tell HouseX AI what you're looking for — by text or voice. RERA-verified homes, no spam calls, no brokers. Free for buyers, forever.",
};

const STEPS = [
  {
    icon: MessageCircle,
    step: "STEP 01",
    title: "Tell HouseX AI what you want",
    body: "Type or speak. Hindi, Marathi, English — HouseX AI understands. “2BHK under 60L near school” is enough.",
  },
  {
    icon: Rotate3D,
    step: "STEP 02",
    title: "See every detail upfront",
    body: "Video tours, floor-wise prices, what's nearby — see every room before you waste a Sunday on a site visit.",
  },
  {
    icon: BadgePercent,
    step: "STEP 03",
    title: "Chat. Negotiate. Done.",
    body: "Talk to the developer directly inside HouseX. Get rate offers. Book your visit. No middleman.",
  },
];

const BENEFITS = [
  {
    title: "No spam calls",
    body: "Brokers don't see your number. Only developers you choose to share it with do.",
  },
  {
    title: "RERA-verified projects only",
    body: "Every property checked. No fake listings. No “owner” who turns out to be a broker.",
  },
  {
    title: "Negotiate inside the chat",
    body: "Developers send rate offers. You accept, counter, or walk. Like ordering food.",
  },
];

export const dynamic = "force-dynamic";

const STAGE_CARDS: Record<string, { emoji: string; line: string }> = {
  "Ready to move": { emoji: "🔑", line: "Skip rent — move in now. No GST." },
  "Under construction": { emoji: "🏗️", line: "Pay less today, staged payments." },
  "New launch": { emoji: "🚀", line: "Lowest prices, best unit choice." },
};

export default async function Landing() {
  // live counts per stage — best-effort; cards still render without the DB
  let stageCounts: Record<string, number> = {};
  try {
    const grouped = await prisma.property.groupBy({ by: ["stage"], where: { status: "Live" }, _count: true });
    stageCounts = Object.fromEntries(grouped.map((g) => [g.stage, g._count]));
  } catch {
    stageCounts = {};
  }

  return (
    <div className="min-h-dvh bg-white text-hx-ink">
      {/* ── nav ── */}
      <nav className="px-5 sm:px-8 py-3.5 border-b border-hx-line/70 flex items-center bg-white sticky top-0 z-20">
        <Link href="/" className="flex items-center" aria-label="HouseX">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/housex-logo.png" alt="HouseX" className="h-9 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/developer/login" className="hidden sm:inline-flex h-9 px-3 rounded-lg items-center text-[13px] text-hx-slate hover:bg-hx-bg">Sign in</Link>
          <Link href="/chat" className="h-9 px-4 rounded-[10px] bg-hx-red text-white text-[13px] font-medium inline-flex items-center shadow-hx-red">Get started free</Link>
        </div>
      </nav>

      {/* ── hero ── */}
      <section className="px-6 pt-14 pb-12 text-center" style={{ background: "linear-gradient(to bottom, #ffffff, #FAFAFA)" }}>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-hx-red" style={{ background: "rgba(224,57,67,0.08)" }}>
          <Sparkles className="w-3.5 h-3.5" /> AI-powered home search · India
        </span>
        <h1 className="mt-5 text-[36px] sm:text-[44px] font-medium leading-[1.1] tracking-[-1px]">
          Stop scrolling listings.
          <br />
          <span className="text-hx-red">Just talk to HouseX AI.</span>
        </h1>
        <p className="mt-4 text-[16px] text-hx-muted max-w-[520px] mx-auto leading-relaxed">
          Tell HouseX what home you&apos;re looking for — by text or voice. See every detail.
          Chat directly with the developer. No spam calls. No brokers. Free, forever.
        </p>

        {/* search box — type here, lands in the chat with your question already sent */}
        <HeroSearch />
        <p className="mt-3 text-[12px] text-hx-muted">
          Try: &quot;3BHK in Vasai with parking&quot; · &quot;₹1 Cr flat near a metro&quot; · &quot;Ready to move in Borivali&quot;
        </p>

        {/* browse by stage — the buyer's first real question: can I move in? */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-[720px] mx-auto text-left">
          {STAGES.map((s) => (
            <Link key={s} href={`/properties?stage=${encodeURIComponent(s)}`} className="rounded-2xl border border-hx-line bg-white p-4 hover:border-hx-red/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[22px]">{STAGE_CARDS[s].emoji}</span>
                {(stageCounts[s] ?? 0) > 0 && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold num ${STAGE_BADGE[s]}`}>{stageCounts[s]} project{stageCounts[s] > 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="mt-2 text-[14.5px] font-semibold tracking-tight">{s}</div>
              <div className="mt-0.5 text-[12px] text-hx-muted leading-relaxed">{STAGE_CARDS[s].line}</div>
              <div className="mt-2 text-[12px] font-semibold text-hx-red inline-flex items-center gap-1">Browse <ArrowRight className="w-3.5 h-3.5" /></div>
            </Link>
          ))}
        </div>

        {/* trust strip */}
        <div className="mt-10 pt-6 border-t border-hx-line/70 max-w-[720px] mx-auto grid grid-cols-3 gap-4">
          <Stat icon={<BadgeCheck className="w-4 h-4 text-hx-success" />} v="RERA" l="verified projects only" />
          <Stat icon={<PhoneOff className="w-4 h-4 text-hx-slate" />} v="0" l="spam calls. ever." />
          <Stat icon={<Sparkles className="w-4 h-4 text-hx-red" />} v="Free" l="for buyers, forever" />
        </div>
      </section>

      {/* ── how it works ── */}
      <section className="px-6 py-14 bg-white border-t border-hx-line/70">
        <div className="text-center mb-10">
          <div className="text-[12px] font-medium text-hx-red uppercase tracking-[1px]">How it works</div>
          <h2 className="mt-2 text-[28px] sm:text-[30px] font-medium tracking-[-0.5px]">Three taps to your next home.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[980px] mx-auto">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="rounded-2xl border border-hx-line/70 p-6" style={{ background: "#FAFAFA" }}>
                <span className="w-11 h-11 rounded-xl inline-flex items-center justify-center text-hx-red" style={{ background: "rgba(224,57,67,0.08)" }}>
                  <Icon className="w-[22px] h-[22px]" />
                </span>
                <div className="mt-4 text-[11px] font-medium text-hx-red tracking-wide">{s.step}</div>
                <div className="mt-1.5 text-[17px] font-medium">{s.title}</div>
                <p className="mt-2 text-[13px] text-hx-muted leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── why housex ── */}
      <section className="px-6 py-14 border-t border-hx-line/70" style={{ background: "#FAFAFA" }}>
        <div className="max-w-[980px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[12px] font-medium text-hx-red uppercase tracking-[1px]">Why HouseX</div>
            <h2 className="mt-2 text-[28px] sm:text-[30px] font-medium leading-[1.2] tracking-[-0.5px]">
              Built for buyers.
              <br />
              Sold to developers.
            </h2>
            <p className="mt-3 text-[14px] text-hx-muted leading-relaxed">
              We make money from developers who pay for verified leads. You stay free, anonymous,
              and in control. Your phone number is yours until <em>you</em> decide to share it.
            </p>
            <div className="mt-6 space-y-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(22,163,74,0.1)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-hx-success" />
                  </span>
                  <div>
                    <div className="text-[13px] font-medium">{b.title}</div>
                    <p className="text-[12px] text-hx-muted leading-relaxed mt-0.5">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* mini chat preview */}
          <div className="bg-white rounded-2xl border border-hx-line/70 p-5 shadow-hx">
            <div className="flex items-center gap-2 pb-3 border-b border-hx-line/70">
              <span className="w-7 h-7 rounded-full bg-hx-red inline-flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" /></span>
              <span className="text-[12px] font-medium">HouseX AI</span>
              <span className="ml-auto text-[11px] text-hx-success">● Online</span>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-[4px] bg-hx-red text-white px-3.5 py-2 text-[12px] font-deva">मुझे Vasai में 2BHK चाहिए ₹50L तक</div>
            </div>
            <div className="mt-3 flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-[4px] px-3.5 py-2 text-[12px] text-hx-ink" style={{ background: "#F1F5F9" }}>
                Got it. Found 4 matching projects. Best fit: <strong>Vasai Greens</strong>, ₹48 L, ready to move 👇
              </div>
            </div>
            <div className="mt-3 h-[60px] rounded-[10px] flex items-end p-2.5" style={{ background: "linear-gradient(135deg,#2563EB,#1E40AF)" }}>
              <span className="text-white text-[11px]">Vasai Greens · 2BHK · ₹48 L</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <Link href="/chat" className="h-8 rounded-lg bg-white border border-hx-line/70 text-hx-slate text-[11px] font-medium inline-flex items-center justify-center">View details</Link>
              <Link href="/chat" className="h-8 rounded-lg bg-hx-red text-white text-[11px] font-medium inline-flex items-center justify-center">Chat developer</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── final CTA ── */}
      <section className="px-6 py-14 text-center bg-hx-ink">
        <h2 className="text-[28px] sm:text-[32px] font-medium text-white tracking-[-0.5px]">Your next home is one conversation away.</h2>
        <p className="mt-2 text-[14px]" style={{ color: "#94A3B8" }}>Free for buyers. No card. No spam. Just talk to HouseX AI.</p>
        <Link href="/chat" className="mt-7 inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-hx-red text-white text-[15px] font-medium shadow-hx-red">
          Start chatting with HouseX AI <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="mt-4 text-[11px] inline-flex items-center gap-1.5" style={{ color: "#64748B" }}>
          <Smartphone className="w-3.5 h-3.5" /> Works on any phone — add it to your home screen
        </p>
      </section>

      {/* ── footer ── */}
      <footer className="px-6 py-7" style={{ background: "#0B1220" }}>
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "#94A3B8" }}>
            <span className="w-6 h-6 rounded-md bg-hx-red inline-flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/housex-mark-white.png" alt="" className="w-[66%] h-[66%] object-contain" />
            </span>
            HouseX · housex.ai
          </div>
          <div className="flex items-center gap-5 text-[11px]" style={{ color: "#64748B" }}>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/pricing" className="hover:text-white">List your project</Link>
            <a href="mailto:hello@housex.ai" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon, v, l }: { icon: React.ReactNode; v: string; l: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 text-[20px] sm:text-[22px] font-medium">{icon}{v}</div>
      <div className="text-[11px] text-hx-muted mt-0.5">{l}</div>
    </div>
  );
}
