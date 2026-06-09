"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Search, MoreVertical, Signal, Wifi, CheckCheck, MapPin, Camera,
  BadgeCheck, Heart, PlayCircle, MessageCircle, Play, Clock, ArrowRight,
  UserPlus, BadgePercent, CheckCircle2, XCircle, Send, Plus, Smile, Mic, X,
  Check, Maximize2, Languages,
} from "lucide-react";

type Msg =
  | { id: number; kind: "user"; text: string; time: string }
  | { id: number; kind: "baba"; html: string; time: string };

const CARDS = [
  { name: "Greenvalley", by: "by Square Homes", price: "₹54 L", psf: "₹7,500/sqft", dist: "Virar West · 800m from station", sqft: "720", facing: "East", match: "96% match", photos: "24", stripe: "ph-stripe-warm" },
  { name: "Sunrise Heights", by: "by Patel Realty", price: "₹58 L", psf: "₹8,406/sqft", dist: "Virar West · 1.2km from station", sqft: "690", facing: "North", match: "91% match", photos: "18", stripe: "ph-stripe-cool" },
  { name: "Palm Crest Annexe", by: "by Hubtown", price: "₹52 L", psf: "₹7,222/sqft", dist: "Virar West · 1.8km from station", sqft: "720", facing: "East", match: "88% match", photos: "16", stripe: "ph-stripe" },
];

function nowTime() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}

function babaReply(t: string) {
  const low = t.toLowerCase();
  if (low.includes("site") || low.includes("visit"))
    return `I can hold a slot at <span class="font-semibold">Greenvalley</span> this Saturday at <span class="num font-semibold">11 AM</span>. Confirm?`;
  if (low.includes("emi") || low.includes("loan"))
    return `For <span class="num font-semibold">₹52 L</span> at 8.6% for 20 yrs, EMI is roughly <span class="num font-semibold">₹45,400/mo</span>. Want me to pre-check eligibility?`;
  if (low.includes("similar") || low.includes("more"))
    return `I'll widen to <span class="font-semibold">Nalasopara West</span> and ping you in <span class="num font-semibold">2 min</span> with 4 fresh options.`;
  if (low.includes("hi") || low.includes("hello") || low.includes("namaste"))
    return `Hello! Want me to book the site visit, run an EMI, or find more like Greenvalley?`;
  return `Got it. I'll keep digging — want me to also <span class="font-semibold">book the site visit</span> or <span class="font-semibold">run an EMI estimate</span>?`;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [offerState, setOfferState] = useState<"default" | "counter" | "accepted" | "declined" | "countered">("default");
  const [counterValue, setCounterValue] = useState("50,00,000");

  const threadRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    });
  };
  useEffect(scrollBottom, [messages, typing]);

  // recording timer
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const pushUser = (text: string) =>
    setMessages((m) => [...m, { id: ++idRef.current, kind: "user", text, time: nowTime() }]);
  const pushBaba = (html: string) =>
    setMessages((m) => [...m, { id: ++idRef.current, kind: "baba", html, time: nowTime() }]);

  const send = (raw: string) => {
    const txt = raw.trim();
    if (!txt) return;
    pushUser(txt);
    setInput("");
    setTimeout(() => setTyping(true), 350);
    setTimeout(() => {
      setTyping(false);
      pushBaba(babaReply(txt));
    }, 1500);
  };

  const stopRec = (doSend: boolean) => {
    const stamp = `${Math.floor(recSeconds / 60)}:${(recSeconds % 60).toString().padStart(2, "0")}`;
    setRecording(false);
    setRecSeconds(0);
    if (doSend) {
      pushUser(`🎙️ voice · ${stamp}`);
      setTimeout(() => setTyping(true), 300);
      setTimeout(() => {
        setTyping(false);
        pushBaba(`Heard — you said you wanted to <span class="font-semibold">book the visit Sunday morning</span>. Confirm 11 AM at Greenvalley?`);
      }, 1400);
    }
  };

  const finalizeOffer = (state: "accepted" | "declined" | "countered") => {
    setOfferState(state);
    const followUp =
      state === "accepted"
        ? `Congratulations 🎉 Token agreement sent to your WhatsApp. Site visit auto-scheduled for <span class="font-semibold">Saturday 11 AM</span>.`
        : state === "declined"
        ? `No worries. I'll surface 3 alternates under ₹55 L by tomorrow morning.`
        : `Sent. Rohit usually replies within <span class="font-semibold">15 min</span> on weekdays.`;
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBaba(followUp);
      }, 1200);
    }, 300);
  };

  const recStamp = `${Math.floor(recSeconds / 60)}:${(recSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center md:py-10 md:px-6">
      <div className="phone shrink-0">
        <div className="w-full h-full flex flex-col bg-hx-bg">
          {/* status bar */}
          <div className="absolute top-0 left-0 right-0 h-[44px] z-30 px-7 flex items-center justify-between text-[14px] font-semibold text-hx-ink pointer-events-none">
            <span className="num">9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-[10px] w-[110px] h-[28px] rounded-full bg-black" />
            <div className="flex items-center gap-1.5">
              <Signal className="w-4 h-4" />
              <Wifi className="w-4 h-4" />
              <span className="inline-block w-6 h-3 rounded-[3px] border border-hx-ink relative">
                <span className="absolute inset-[1.5px] right-[2px] bg-hx-ink rounded-[1.5px]" />
                <span className="absolute -right-[3px] top-[3px] w-[2px] h-[6px] bg-hx-ink rounded-r-[1px]" />
              </span>
            </div>
          </div>

          {/* app bar */}
          <header className="pt-[44px] bg-white border-b border-hx-line z-20">
            <div className="h-[58px] px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-[12px] bg-hx-red shadow-hx-red text-white inline-flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/housex-mark-white.png" alt="HouseX" style={{ width: "72%", height: "72%", objectFit: "contain" }} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-hx-success ring-2 ring-white" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold tracking-tight truncate">Baba AI</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md bg-hx-ink text-white text-[9px] font-bold tracking-wide uppercase">
                      <Sparkles className="w-[8px] h-[8px]" />AI
                    </span>
                  </div>
                  <div className="text-[11.5px] text-hx-muted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-hx-success" />
                    Online · searching 4,210 homes
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="w-9 h-9 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><Search className="w-4 h-4" /></button>
                <button className="w-9 h-9 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><MoreVertical className="w-4 h-4" /></button>
                <div className="ml-1 w-9 h-9 rounded-full bg-hx-ink text-white text-[12px] font-semibold inline-flex items-center justify-center">AM</div>
              </div>
            </div>
          </header>

          {/* thread */}
          <main ref={threadRef} className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
            <div className="flex justify-center my-1">
              <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur border border-hx-line label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted">Today · 11:48 AM</span>
            </div>

            <BabaRow>
              <span className="font-semibold">Namaste, Asha 👋</span><br />
              Tell me about the home you want. Speak in Hindi, Marathi or English — anything works.
              <Time>11:48 AM</Time>
            </BabaRow>

            <UserRow time="11:49 AM">2 BHK in Virar West under 60 lakh. East-facing if possible 🙏</UserRow>

            <BabaRow wide>
              Found <span className="font-semibold num">3 RERA-verified</span> matches in Virar West. All under your budget, with east-facing units available.
              <Time>11:49 AM</Time>
            </BabaRow>

            {/* carousel */}
            <div className="-mx-3">
              <div className="px-3 mb-1.5 flex items-center justify-between">
                <span className="label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-hx-red" /> 3 matches · swipe →
                </span>
                <span className="num text-[10.5px] text-hx-muted">1 / 3</span>
              </div>
              <div className="snap-x overflow-x-auto no-scrollbar flex gap-3 px-3 pb-1">
                {CARDS.map((c, i) => (
                  <article key={c.name} className="snap-card shrink-0 w-[290px] rounded-[18px] bg-white border border-hx-line shadow-hx overflow-hidden">
                    <div className={`relative h-[150px] ${c.stripe}`}>
                      <div className="absolute inset-0 flex items-center justify-center text-hx-muted text-[10px] label-mono">[ tower exterior · 4:3 ]</div>
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-ink/85 backdrop-blur text-white text-[10px] font-semibold"><Sparkles className="w-2.5 h-2.5" />{c.match}</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          onClick={() => setSaved((s) => ({ ...s, [i]: !s[i] }))}
                          className={`w-7 h-7 rounded-full backdrop-blur inline-flex items-center justify-center ${saved[i] ? "bg-hx-red/95 text-white" : "bg-white/95 text-hx-slate"}`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={saved[i] ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-hx-slate text-[10px] font-semibold"><Camera className="w-2.5 h-2.5" /><span className="num">{c.photos}</span></span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-red text-white text-[10px] font-semibold"><BadgeCheck className="w-2.5 h-2.5" />RERA</span>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold tracking-tight leading-tight truncate">{c.name}</h3>
                          <div className="text-[11.5px] text-hx-muted truncate">{c.by}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="num text-[16px] font-extrabold tracking-tight">{c.price}</div>
                          <div className="num text-[10px] text-hx-muted">{c.psf}</div>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-hx-slate">
                        <MapPin className="w-3 h-3" /><span>{c.dist}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                        <Stat v="2" l="BHK" />
                        <Stat v={c.sqft} l="sqft" />
                        <Stat v={c.facing} l="facing" />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        <button onClick={() => setTourOpen(true)} className="h-10 rounded-[10px] bg-white border border-hx-line text-hx-ink text-[12px] font-semibold inline-flex items-center justify-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" />Take tour</button>
                        <button className="h-10 rounded-[10px] bg-hx-red text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-hx-red"><MessageCircle className="w-3.5 h-3.5" />Chat dev</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <UserRow time="11:51 AM">Greenvalley looks nice. Tour please 🏡</UserRow>

            {/* tour card */}
            <div className="flex items-end gap-2 max-w-[92%]">
              <BabaAvatar />
              <div className="flex-1">
                <button onClick={() => setTourOpen(true)} className="block w-full text-left rounded-[18px] bg-white border border-hx-line shadow-hx overflow-hidden">
                  <div className="relative h-[160px] ph-stripe-tour">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="relative w-14 h-14 inline-flex items-center justify-center">
                        <span className="absolute inset-0 rounded-full bg-white/30 ping-soft" />
                        <span className="relative w-14 h-14 rounded-full bg-white text-hx-red inline-flex items-center justify-center shadow-hx-lg"><Play className="w-6 h-6 fill-current" /></span>
                      </span>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-hx-red text-white text-[10px] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-white" />3D TOUR</span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-hx-ink text-[10px] font-semibold num"><Clock className="w-2.5 h-2.5" />2:14</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold tracking-tight truncate">Greenvalley · 2 BHK East</div>
                      <div className="text-[11.5px] text-hx-muted truncate">Tower B · 8th floor · ₹54 L · Tap to start</div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold shrink-0">Start <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </button>
                <div className="mt-1 text-[10.5px] text-hx-muted label-mono pl-1">11:51 AM</div>
              </div>
            </div>

            <UserRow time="11:54 AM">I love it. Can the developer do anything on price?</UserRow>

            {/* dev joined */}
            <div className="flex justify-center py-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-hx-line label-mono text-[10px] uppercase tracking-[0.12em] text-hx-muted">
                <UserPlus className="w-3 h-3 text-hx-red" />Rohit · Square Homes joined this chat
              </div>
            </div>

            {/* dev reply */}
            <div className="flex items-end gap-2 max-w-[88%]">
              <div className="w-7 h-7 rounded-full bg-hx-ink text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">RP</div>
              <div>
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <span className="text-[11px] font-semibold text-hx-slate">Rohit Patil</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-md bg-hx-ink/5 text-hx-slate text-[9px] font-semibold uppercase tracking-wide">Developer</span>
                </div>
                <div className="rounded-2xl rounded-bl-md bg-white border border-hx-line px-3.5 py-2.5 text-[14px] leading-snug text-hx-ink shadow-hx-sm">
                  Hi Asha! Welcome. We can do <span className="font-semibold">₹52 L</span> all-in for the east-facing 8th floor — includes covered parking + modular kitchen. Valid this week only.
                  <Time>11:55 AM</Time>
                </div>
              </div>
            </div>

            {/* offer card */}
            <div className="flex items-end gap-2 max-w-[92%]">
              <div className="w-7 h-7 rounded-full bg-hx-ink text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">RP</div>
              <div className="flex-1">
                <div className="rounded-[18px] bg-white border border-hx-line shadow-hx-md overflow-hidden">
                  <div className="bg-hx-ink text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/10 inline-flex items-center justify-center"><BadgePercent className="w-3.5 h-3.5" /></span>
                      <span className="text-[12px] font-semibold tracking-tight">Special offer · Greenvalley</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold num"><Clock className="w-2.5 h-2.5" />5d 02h left</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-end gap-3">
                      <div>
                        <div className="text-[11px] text-hx-muted label-mono uppercase tracking-[0.1em]">Final price</div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <div className="num text-[28px] font-extrabold tracking-tight">₹52 L</div>
                          <div className="num text-[14px] text-hx-muted line-through">₹54 L</div>
                        </div>
                        <div className="text-[11.5px] text-hx-success font-semibold mt-0.5 num">You save ₹2,00,000 · 3.7% off</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-[10px] text-hx-muted label-mono uppercase tracking-[0.1em]">8th floor</div>
                        <div className="text-[13px] font-bold mt-0.5">Tower B · East</div>
                      </div>
                    </div>
                    <ul className="mt-3 pt-3 border-t border-hx-line space-y-1.5 text-[12.5px] text-hx-slate">
                      {["Covered parking included", "Modular kitchen + wardrobes", "Stamp duty assistance", "5-yr property tax paid by builder"].map((x) => (
                        <li key={x} className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-hx-success" /> {x}</li>
                      ))}
                    </ul>

                    {offerState === "default" && (
                      <div className="mt-4 grid grid-cols-3 gap-1.5">
                        <button onClick={() => finalizeOffer("declined")} className="h-11 rounded-[10px] bg-white border border-hx-line text-hx-slate text-[12.5px] font-semibold">Decline</button>
                        <button onClick={() => setOfferState("counter")} className="h-11 rounded-[10px] bg-white border border-hx-ink text-hx-ink text-[12.5px] font-semibold">Counter</button>
                        <button onClick={() => finalizeOffer("accepted")} className="h-11 rounded-[10px] bg-hx-red text-white text-[12.5px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-1">Accept <ArrowRight className="w-3.5 h-3.5" /></button>
                      </div>
                    )}

                    {offerState === "counter" && (
                      <div className="mt-4">
                        <div className="text-[11px] label-mono uppercase tracking-[0.1em] text-hx-muted mb-1.5">Your counter offer</div>
                        <div className="flex h-11 rounded-[10px] border border-hx-line bg-white overflow-hidden">
                          <span className="inline-flex items-center px-3 text-[13px] font-semibold text-hx-muted bg-hx-bg border-r border-hx-line">₹</span>
                          <input value={counterValue} onChange={(e) => setCounterValue(e.target.value)} className="flex-1 px-3 text-[14px] num outline-none" />
                          <span className="inline-flex items-center px-3 text-[11px] label-mono text-hx-muted">INR</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <button onClick={() => setOfferState("default")} className="h-10 rounded-[10px] bg-white border border-hx-line text-hx-slate text-[12.5px] font-semibold">Back</button>
                          <button onClick={() => finalizeOffer("countered")} className="h-10 rounded-[10px] bg-hx-red text-white text-[12.5px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-1">Send counter <Send className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}

                    {offerState === "accepted" && (
                      <div className="mt-4 rounded-[10px] p-3 text-[12.5px] font-semibold bg-hx-success/10 text-hx-success flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Offer accepted at <span className="num">₹52 L</span> · token link sent</div>
                    )}
                    {offerState === "declined" && (
                      <div className="mt-4 rounded-[10px] p-3 text-[12.5px] font-semibold bg-hx-bg text-hx-slate flex items-center gap-2 border border-hx-line"><XCircle className="w-4 h-4" /> Offer declined — I&apos;ll find similar in Virar West</div>
                    )}
                    {offerState === "countered" && (
                      <div className="mt-4 rounded-[10px] p-3 text-[12.5px] font-semibold bg-hx-warning/10 text-hx-warning flex items-center gap-2"><Send className="w-4 h-4" /> Counter sent to Rohit · <span className="num">₹{counterValue}</span></div>
                    )}
                  </div>
                </div>
                <div className="mt-1 text-[10.5px] text-hx-muted label-mono pl-1">11:55 AM</div>
              </div>
            </div>

            {/* baba follow-up + quick replies */}
            <div className="flex items-end gap-2 max-w-[92%]">
              <BabaAvatar />
              <div>
                <div className="rounded-2xl rounded-bl-md bg-white border border-hx-line px-3.5 py-2.5 text-[14px] leading-snug text-hx-ink shadow-hx-sm">
                  Want me to help with anything else?
                  <Time>11:55 AM</Time>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Book site visit", "EMI calculator", "Show similar"].map((q) => (
                    <button key={q} onClick={() => send(q)} className="h-8 px-3 rounded-full bg-white border border-hx-line text-hx-slate text-[12px] font-semibold">{q}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* dynamic messages */}
            {messages.map((m) =>
              m.kind === "user" ? (
                <div key={m.id} className="ml-auto max-w-[82%] flex flex-col items-end pop-in">
                  <div className="rounded-2xl rounded-br-md bg-hx-red text-white px-3.5 py-2.5 text-[14px] leading-snug shadow-hx-red">{m.text}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10.5px] text-hx-muted label-mono">{m.time} <CheckCheck className="w-3 h-3 text-hx-red" /></div>
                </div>
              ) : (
                <div key={m.id} className="flex items-end gap-2 max-w-[88%] pop-in">
                  <BabaAvatar />
                  <div className="rounded-2xl rounded-bl-md bg-white border border-hx-line px-3.5 py-2.5 text-[14px] leading-snug text-hx-ink shadow-hx-sm">
                    <span dangerouslySetInnerHTML={{ __html: m.html }} />
                    <Time>{m.time}</Time>
                  </div>
                </div>
              )
            )}

            {typing && (
              <div className="flex items-end gap-2 max-w-[60%]">
                <BabaAvatar />
                <div className="rounded-2xl rounded-bl-md bg-white border border-hx-line px-3.5 py-3 shadow-hx-sm inline-flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: "0s" }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: ".15s" }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: ".3s" }} />
                </div>
              </div>
            )}
            <div className="h-2" />
          </main>

          {/* composer */}
          <footer className="px-3 pt-2 pb-5 bg-white/95 backdrop-blur border-t border-hx-line z-20">
            {!recording ? (
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full bg-hx-bg text-hx-slate inline-flex items-center justify-center shrink-0"><Plus className="w-5 h-5" /></button>
                <div className="flex-1 h-11 rounded-full border border-hx-line bg-hx-bg flex items-center px-3.5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                    className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-hx-muted"
                    placeholder="Message Baba…"
                    autoComplete="off"
                  />
                  <button className="text-hx-muted ml-1"><Smile className="w-4 h-4" /></button>
                </div>
                {input.trim() ? (
                  <button onClick={() => send(input)} className="w-11 h-11 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red"><Send className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => { setRecSeconds(0); setRecording(true); }} className="w-12 h-12 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red"><Mic className="w-5 h-5" /></button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 h-12 rounded-full border-2 border-hx-red bg-white flex items-center gap-2 px-3" style={{ boxShadow: "0 0 0 4px rgba(224,57,67,0.10)" }}>
                  <span className="relative flex w-2 h-2 shrink-0">
                    <span className="absolute inset-0 rounded-full bg-hx-red/50 ping-soft" />
                    <span className="relative w-2 h-2 rounded-full bg-hx-red" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-hx-ink whitespace-nowrap">Listening…</span>
                  <div className="flex items-end gap-[2px] h-5 flex-1">
                    {[0, .08, .16, .24, .32, .40, .48, .56, .32, .16, .08, .32].map((d, i) => (
                      <span key={i} className="wf-bar w-[3px] h-full bg-hx-red rounded-full" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                  <span className="num text-[12px] font-semibold text-hx-slate shrink-0">{recStamp}</span>
                </div>
                <button onClick={() => stopRec(false)} className="w-10 h-10 rounded-full bg-hx-bg text-hx-slate inline-flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
                <button onClick={() => stopRec(true)} className="w-12 h-12 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red"><Check className="w-5 h-5" /></button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-hx-muted label-mono">
              <Languages className="w-3 h-3" /> Hindi · Marathi · English · Baba understands all three
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5 w-32 h-1 rounded-full bg-hx-ink/80" />
          </footer>

          {/* tour overlay */}
          <div className={`tour-overlay ${tourOpen ? "" : "hidden"} absolute inset-0 z-40 bg-hx-ink`}>
            <div className="absolute inset-0 ph-stripe-tour" />
            <div className="absolute top-0 left-0 right-0 pt-[52px] px-4 flex items-center justify-between z-10">
              <button onClick={() => setTourOpen(false)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE 3D TOUR</div>
              <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white inline-flex items-center justify-center"><Maximize2 className="w-4 h-4" /></button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-hx-red shadow-hx-lg"><Play className="w-9 h-9 fill-current" /></div>
                <div className="mt-4 text-white font-bold tracking-tight text-[18px]">Greenvalley · 2 BHK East</div>
                <div className="mt-1 text-white/70 text-[12px] label-mono">Tower B · 8th floor · 720 sqft</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 pb-8 px-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3">
                <div className="flex items-center justify-between text-white text-[11px] label-mono num mb-2"><span>0:00</span><span>2:14</span></div>
                <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-hx-red rounded-full" style={{ width: "8%" }} /></div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-white text-[11px] font-semibold">
                  <div className="rounded-lg bg-white/10 py-1.5 text-center">Living</div>
                  <div className="rounded-lg bg-hx-red py-1.5 text-center">Kitchen</div>
                  <div className="rounded-lg bg-white/10 py-1.5 text-center">Bed 1</div>
                  <div className="rounded-lg bg-white/10 py-1.5 text-center">Balcony</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BabaAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red"><Sparkles className="w-3.5 h-3.5" /></div>
  );
}
function BabaRow({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${wide ? "max-w-[92%]" : "max-w-[88%]"}`}>
      <BabaAvatar />
      <div className="rounded-2xl rounded-bl-md bg-white border border-hx-line px-3.5 py-2.5 text-[14px] leading-snug text-hx-ink shadow-hx-sm">{children}</div>
    </div>
  );
}
function UserRow({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="ml-auto max-w-[82%] flex flex-col items-end">
      <div className="rounded-2xl rounded-br-md bg-hx-red text-white px-3.5 py-2.5 text-[14px] leading-snug shadow-hx-red">{children}</div>
      <div className="mt-1 flex items-center gap-1 text-[10.5px] text-hx-muted label-mono">{time} <CheckCheck className="w-3 h-3 text-hx-red" /></div>
    </div>
  );
}
function Time({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[10.5px] text-hx-muted label-mono">{children}</div>;
}
function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-md bg-hx-bg py-1.5">
      <div className="num text-[12px] font-bold">{v}</div>
      <div className="text-[9px] text-hx-muted uppercase tracking-wider">{l}</div>
    </div>
  );
}
