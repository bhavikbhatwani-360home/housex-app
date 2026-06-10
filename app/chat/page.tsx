"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowUp, Plus, House, IndianRupee, Compass, CalendarCheck, MapPin, BadgeCheck, CalendarPlus, X, Check, Video, Building2, BadgePercent } from "lucide-react";

type PropertyCard = {
  id: string; name: string; developer: string; locality: string; city: string;
  bhk: string; facing: string; priceMin: number; priceMax: number;
  distanceToStationM: number; reraId: string; unitCount: number;
};

type OfferData = {
  id: string; propertyName: string; listPriceLakh: number | null; offerPriceLakh: number;
  note: string | null; validUntil: string | null; status: string; counterPriceLakh: number | null;
};

type Msg =
  | { id: number; role: "user"; text: string; sid?: string }
  | { id: number; role: "baba"; html: string; properties?: PropertyCard[]; sid?: string }
  | { id: number; role: "developer"; html: string; senderName: string; sid?: string }
  | { id: number; role: "offer"; offer: OfferData; sid: string };

const STRIPES = [
  "repeating-linear-gradient(135deg,#F1E2D8 0 12px,#FAEFE7 12px 24px)",
  "repeating-linear-gradient(135deg,#DCE7F0 0 12px,#ECF2F7 12px 24px)",
  "repeating-linear-gradient(135deg,#E2E8F0 0 12px,#EEF2F6 12px 24px)",
];

const SUGGESTIONS = [
  { icon: House, text: "2 BHK in Virar West under ₹60 lakh" },
  { icon: IndianRupee, text: "What's the EMI on ₹52 lakh?" },
  { icon: Compass, text: "Show me east-facing homes near a station" },
  { icon: CalendarCheck, text: "Help me book a site visit" },
];

function babaReplyFallback(t: string) {
  const low = t.toLowerCase();
  if (low.includes("site") || low.includes("visit"))
    return `I can hold a slot at <span class="font-semibold">Greenvalley</span> this Saturday at 11 AM. Confirm?`;
  if (low.includes("emi") || low.includes("loan"))
    return `For ₹52 L at 8.6% over 20 yrs, EMI is roughly <span class="font-semibold">₹45,400/mo</span>. Want me to pre-check eligibility?`;
  return `Got it. Want me to <span class="font-semibold">book a site visit</span> or <span class="font-semibold">run an EMI estimate</span>?`;
}

function htmlToText(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function formatReply(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, '<span class="font-semibold">$1</span>').replace(/\n/g, "<br/>");
}

function initials(s: string) {
  const base = s.replace(/·.*/, "").trim();
  const parts = base.split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "D";
}

function PropertyCardView({ p, stripe, onBook }: { p: PropertyCard; stripe: string; onBook: () => void }) {
  const range = p.priceMin === p.priceMax ? `₹${p.priceMin} L` : `₹${p.priceMin}–${p.priceMax} L`;
  return (
    <div className="shrink-0 w-[240px] rounded-2xl border border-hx-line bg-white overflow-hidden shadow-hx">
      <Link href={`/property/${p.id}`} className="block">
        <div className="relative h-[96px]" style={{ backgroundImage: stripe }}>
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-red text-white text-[10px] font-semibold">
            <BadgeCheck className="w-2.5 h-2.5" /> RERA
          </span>
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/property/${p.id}`} className="block">
          <div className="text-[14px] font-semibold tracking-tight truncate hover:text-hx-red">{p.name}</div>
          <div className="text-[11px] text-hx-muted truncate">{p.developer}</div>
        </Link>
        <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-hx-slate">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{p.locality} · {p.distanceToStationM} m to station</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="num text-[15px] font-bold tracking-tight">{range}</span>
          <span className="text-[11px] text-hx-muted">· {p.bhk} · {p.facing}</span>
        </div>
        <button onClick={onBook} className="mt-3 w-full h-9 rounded-lg bg-hx-red text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-hx-red">
          <CalendarPlus className="w-3.5 h-3.5" /> Book a visit
        </button>
      </div>
    </div>
  );
}

function OfferCardChat({ offer, onRespond }: { offer: OfferData; onRespond: (id: string, action: "accept" | "decline" | "counter", counter?: number) => void }) {
  const [countering, setCountering] = useState(false);
  const [counter, setCounter] = useState("");
  const list = offer.listPriceLakh;
  const savings = list && list > offer.offerPriceLakh ? list - offer.offerPriceLakh : 0;
  const resolved = offer.status !== "Pending";

  return (
    <div className="rounded-2xl border border-hx-line bg-white overflow-hidden shadow-hx max-w-[360px]">
      <div className="bg-hx-ink text-white px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold tracking-tight inline-flex items-center gap-1.5 min-w-0"><BadgePercent className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Special offer · {offer.propertyName}</span></span>
        {offer.validUntil && <span className="text-[10px] font-semibold bg-white/10 rounded-full px-2 py-0.5 shrink-0">valid {offer.validUntil}</span>}
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="num text-[26px] font-extrabold tracking-tight">₹{offer.offerPriceLakh} L</span>
          {list ? <span className="num text-[14px] text-hx-muted line-through">₹{list} L</span> : null}
        </div>
        {savings > 0 && <div className="text-[12px] text-hx-success font-semibold num">You save ₹{savings} L</div>}
        {offer.note && <p className="mt-2 text-[12.5px] text-hx-slate leading-snug">{offer.note}</p>}

        {resolved ? (
          <div className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 ${offer.status === "Accepted" ? "bg-hx-success/10 text-hx-success" : offer.status === "Countered" ? "bg-hx-warning/10 text-hx-warning" : "bg-hx-bg text-hx-slate"}`}>
            {offer.status === "Accepted" && <Check className="w-3.5 h-3.5" />}
            {offer.status === "Accepted" ? "You accepted this offer" : offer.status === "Countered" ? `You countered ₹${offer.counterPriceLakh} L` : "You declined this offer"}
          </div>
        ) : countering ? (
          <div className="mt-3">
            <div className="flex h-10 rounded-lg border border-hx-line overflow-hidden">
              <span className="inline-flex items-center px-3 text-[13px] font-semibold text-hx-muted bg-hx-bg border-r border-hx-line">₹</span>
              <input value={counter} onChange={(e) => setCounter(e.target.value)} type="number" placeholder="Your price" className="flex-1 px-3 text-[14px] num outline-none" />
              <span className="inline-flex items-center px-3 text-[11px] text-hx-muted">L</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button onClick={() => setCountering(false)} className="h-9 rounded-lg border border-hx-line text-[12.5px] font-semibold text-hx-slate">Back</button>
              <button onClick={() => { const c = Number(counter); if (c > 0) onRespond(offer.id, "counter", c); }} className="h-9 rounded-lg bg-hx-red text-white text-[12.5px] font-semibold shadow-hx-red">Send counter</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button onClick={() => onRespond(offer.id, "decline")} className="h-10 rounded-lg border border-hx-line text-hx-slate text-[12.5px] font-semibold">Decline</button>
            <button onClick={() => setCountering(true)} className="h-10 rounded-lg border border-hx-ink text-hx-ink text-[12.5px] font-semibold">Counter</button>
            <button onClick={() => onRespond(offer.id, "accept")} className="h-10 rounded-lg bg-hx-red text-white text-[12.5px] font-semibold shadow-hx-red">Accept</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [bookingFor, setBookingFor] = useState<PropertyCard | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const convIdRef = useRef<string>("");
  const seenRef = useRef<Set<string>>(new Set());
  const lastTsRef = useRef<string>("");
  const empty = messages.length === 0;

  const ensureConvId = () => {
    if (convIdRef.current) return convIdRef.current;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hx-conv");
      convIdRef.current = saved || crypto.randomUUID();
      if (!saved) localStorage.setItem("hx-conv", convIdRef.current);
    }
    return convIdRef.current;
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Resume the conversation + receive developer replies (poll every 5s)
  useEffect(() => {
    const cid = ensureConvId();
    if (!cid) return;

    // load existing history (so the chat resumes, incl. any developer replies)
    (async () => {
      try {
        const res = await fetch(`/api/messages?conversationId=${cid}`);
        const data = await res.json();
        const loaded: Msg[] = [];
        let maxTs = "";
        for (const m of data.messages || []) {
          if (seenRef.current.has(m.id)) continue;
          seenRef.current.add(m.id);
          if (m.createdAt > maxTs) maxTs = m.createdAt;
          if (m.role === "user") loaded.push({ id: ++idRef.current, role: "user", text: m.content, sid: m.id });
          else if (m.role === "developer") loaded.push({ id: ++idRef.current, role: "developer", html: formatReply(m.content), senderName: m.senderName || "Developer", sid: m.id });
          else loaded.push({ id: ++idRef.current, role: "baba", html: formatReply(m.content), sid: m.id });
        }
        // existing offers
        try {
          const ores = await fetch(`/api/offers?conversationId=${cid}`);
          const odata = await ores.json();
          for (const o of odata.offers || []) {
            const key = "offer-" + o.id;
            if (seenRef.current.has(key)) continue;
            seenRef.current.add(key);
            loaded.push({ id: ++idRef.current, role: "offer", offer: o, sid: o.id });
          }
        } catch {}
        if (loaded.length) setMessages(loaded);
        lastTsRef.current = maxTs || new Date().toISOString();
      } catch {}
    })();

    const poll = setInterval(async () => {
      const c = convIdRef.current;
      if (!c) return;
      try {
        const since = lastTsRef.current ? `&since=${encodeURIComponent(lastTsRef.current)}` : "";
        const res = await fetch(`/api/messages?conversationId=${c}&role=developer${since}`);
        const data = await res.json();
        const incoming: Msg[] = [];
        for (const m of data.messages || []) {
          if (seenRef.current.has(m.id)) continue;
          seenRef.current.add(m.id);
          if (m.createdAt > lastTsRef.current) lastTsRef.current = m.createdAt;
          incoming.push({ id: ++idRef.current, role: "developer", html: formatReply(m.content), senderName: m.senderName || "Developer", sid: m.id });
        }
        if (incoming.length) setMessages((cur) => [...cur, ...incoming]);
      } catch {}
      // new offers
      try {
        const ores = await fetch(`/api/offers?conversationId=${c}`);
        const odata = await ores.json();
        const newOffers: Msg[] = [];
        for (const o of odata.offers || []) {
          const key = "offer-" + o.id;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          newOffers.push({ id: ++idRef.current, role: "offer", offer: o, sid: o.id });
        }
        if (newOffers.length) setMessages((cur) => [...cur, ...newOffers]);
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const send = async (raw: string) => {
    const txt = raw.trim();
    if (!txt || typing) return;
    const history: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of messages) {
      if (m.role === "user") history.push({ role: "user", content: m.text });
      else if (m.role === "baba" || m.role === "developer") history.push({ role: "assistant", content: htmlToText(m.html) });
    }
    setMessages((m) => [...m, { id: ++idRef.current, role: "user", text: txt }]);
    setInput("");
    requestAnimationFrame(autoGrow);
    setTyping(true);
    try {
      const res = await fetch("/api/baba", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: ensureConvId(), messages: [...history, { role: "user", content: txt }] }),
      });
      const data = await res.json();
      setTyping(false);
      setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html: formatReply(data.reply || ""), properties: data.properties }]);
    } catch {
      setTyping(false);
      setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html: babaReplyFallback(txt) }]);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setTyping(false);
    const nid = crypto.randomUUID();
    convIdRef.current = nid;
    if (typeof window !== "undefined") localStorage.setItem("hx-conv", nid);
    seenRef.current = new Set();
    lastTsRef.current = new Date().toISOString();
  };

  const respondOffer = async (offerId: string, action: "accept" | "decline" | "counter", counterPriceLakh?: number) => {
    const newStatus = action === "accept" ? "Accepted" : action === "decline" ? "Declined" : "Countered";
    setMessages((cur) =>
      cur.map((m) =>
        m.role === "offer" && m.offer.id === offerId
          ? { ...m, offer: { ...m.offer, status: newStatus, counterPriceLakh: action === "counter" ? (counterPriceLakh ?? null) : m.offer.counterPriceLakh } }
          : m
      )
    );
    try {
      await fetch(`/api/offers/${offerId}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, counterPriceLakh }),
      });
    } catch {}
    const follow =
      action === "accept"
        ? `🎉 Great choice! I've told the developer you accepted. They'll reach out to take it forward.`
        : action === "decline"
        ? `No worries — I'll keep an eye out for better-fit homes nearby.`
        : `Sent your counter of ₹${counterPriceLakh} L to the developer. They usually reply quickly.`;
    setMessages((cur) => [...cur, { id: ++idRef.current, role: "baba", html: follow }]);
  };

  const confirmVisit = async (date: string, slot: string, mode: string, buyerName: string, buyerPhone: string) => {
    const p = bookingFor;
    if (!p) return;
    setBookingFor(null);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: ensureConvId(), propertyId: p.id, propertyName: p.name, date, slot, mode, buyerName, buyerPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html:
          `🎉 <span class="font-semibold">Site visit booked!</span><br/>${p.name} · ${date} · ${slot} · ${mode}.<br/>The developer will confirm shortly, and I'll remind you before.` }]);
      } else {
        setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html:
          `I couldn't lock that in just now. Want to try another slot?` }]);
      }
    } catch {
      setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html:
        `I couldn't reach the booking service — try again in a moment?` }]);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-white text-hx-ink">
      {/* top bar */}
      <header className="shrink-0 h-14 border-b border-hx-line/70 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[10px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[68%] h-[68%] object-contain" />
          </span>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">HouseX AI</div>
            <div className="text-[11px] text-hx-muted -mt-0.5">Your home assistant</div>
          </div>
        </div>
        <button onClick={newChat} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-hx-line text-[13px] font-medium text-hx-slate hover:bg-hx-bg transition-colors">
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </header>

      {/* conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center px-5 text-center">
            <span className="w-14 h-14 rounded-2xl bg-hx-red inline-flex items-center justify-center shadow-hx-red mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </span>
            <div className="font-deva text-[15px] text-hx-red mb-1">नमस्ते 🙏</div>
            <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight">How can I help you find a home?</h1>
            <p className="mt-2 text-[14px] text-hx-muted max-w-[420px] leading-relaxed">
              Tell me what you&apos;re looking for — by budget, area, or BHK. I&apos;ll surface RERA-verified homes that actually fit.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[540px]">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="group text-left rounded-2xl border border-hx-line bg-white hover:bg-hx-bg hover:border-hx-red/30 transition-colors px-4 py-3 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-lg bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[13.5px] font-medium text-hx-slate leading-snug">{s.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-hx-bg border border-hx-line px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                  </div>
                );
              }
              if (m.role === "developer") {
                return (
                  <div key={m.id} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-hx-ink text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0 mt-0.5">{initials(m.senderName)}</span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[12px] font-semibold text-hx-slate mb-1 flex items-center gap-1.5">
                        {m.senderName}
                        <span className="text-[9px] font-bold uppercase tracking-wider text-hx-red bg-hx-red/10 rounded px-1.5 py-[1px]">Developer</span>
                      </div>
                      <div className="inline-block rounded-2xl rounded-tl-md bg-white border border-hx-line px-3.5 py-2.5 text-[15px] leading-relaxed text-hx-ink" dangerouslySetInnerHTML={{ __html: m.html }} />
                    </div>
                  </div>
                );
              }
              if (m.role === "offer") {
                return (
                  <div key={m.id} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-hx-ink text-white inline-flex items-center justify-center shrink-0 mt-0.5"><BadgePercent className="w-3.5 h-3.5" /></span>
                    <div className="flex-1 min-w-0 pt-0.5"><OfferCardChat offer={m.offer} onRespond={respondOffer} /></div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex gap-3">
                  <span className="w-7 h-7 rounded-lg bg-hx-red inline-flex items-center justify-center shrink-0 mt-0.5 shadow-hx-red">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-[12px] font-semibold text-hx-muted mb-1">HouseX AI</div>
                    <div className="text-[15px] leading-relaxed text-hx-ink" dangerouslySetInnerHTML={{ __html: m.html }} />
                    {m.properties && m.properties.length > 0 && (
                      <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                        {m.properties.map((p, i) => (
                          <PropertyCardView key={p.id} p={p} stripe={STRIPES[i % STRIPES.length]} onBook={() => setBookingFor(p)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex gap-3">
                <span className="w-7 h-7 rounded-lg bg-hx-red inline-flex items-center justify-center shrink-0 mt-0.5 shadow-hx-red">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
                <div className="pt-2 inline-flex items-center gap-1.5">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: "0s" }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: ".15s" }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-hx-muted" style={{ animationDelay: ".3s" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="shrink-0 bg-white border-t border-hx-line/0">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-end gap-2 rounded-[24px] border border-hx-line bg-white shadow-hx px-3 py-2 focus-within:border-hx-red/40 transition-colors">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoGrow(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Message HouseX AI…"
              className="flex-1 resize-none bg-transparent outline-none text-[15px] leading-relaxed py-1.5 px-1.5 placeholder:text-hx-muted max-h-[200px]"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-full bg-hx-red text-white inline-flex items-center justify-center shrink-0 shadow-hx-red disabled:opacity-30 disabled:shadow-none transition-opacity"
              aria-label="Send"
            >
              <ArrowUp className="w-[18px] h-[18px]" />
            </button>
          </div>
          <p className="text-center text-[11px] text-hx-muted mt-2">
            HouseX AI helps you find RERA-verified homes · Hindi · Marathi · English · Replies can have mistakes — verify key details.
          </p>
        </div>
      </div>

      {bookingFor && (
        <BookingSheet property={bookingFor} onClose={() => setBookingFor(null)} onConfirm={confirmVisit} />
      )}
    </div>
  );
}

const SLOTS = ["10:00 AM", "11:30 AM", "2:00 PM", "4:00 PM", "6:00 PM"];

function nextDays(n: number) {
  const out: { label: string; sub: string; full: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      sub: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      full: d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }),
    });
  }
  return out;
}

function BookingSheet({ property, onClose, onConfirm }: { property: PropertyCard; onClose: () => void; onConfirm: (date: string, slot: string, mode: string, buyerName: string, buyerPhone: string) => void }) {
  const days = nextDays(7);
  const [dateIdx, setDateIdx] = useState(1);
  const [slot, setSlot] = useState(SLOTS[1]);
  const [mode, setMode] = useState("In-person");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const valid = buyerName.trim().length > 1 && buyerPhone.replace(/\D/g, "").length >= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl border border-hx-line shadow-hx-lg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-[16px] font-semibold tracking-tight">Book a site visit</div>
            <div className="text-[12.5px] text-hx-muted">{property.name} · {property.locality}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><X className="w-4 h-4" /></button>
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Pick a day</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.map((d, i) => (
            <button key={i} onClick={() => setDateIdx(i)}
              className={`shrink-0 w-[64px] rounded-xl border px-2 py-2 text-center ${dateIdx === i ? "border-hx-red bg-hx-red/5" : "border-hx-line bg-white"}`}>
              <div className={`text-[12px] font-semibold ${dateIdx === i ? "text-hx-red" : "text-hx-ink"}`}>{d.label}</div>
              <div className="text-[10.5px] text-hx-muted num">{d.sub}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Time</div>
        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <button key={s} onClick={() => setSlot(s)}
              className={`px-3 h-9 rounded-lg border text-[13px] font-medium num ${slot === s ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Visit type</div>
        <div className="grid grid-cols-2 gap-2">
          {[{ k: "In-person", icon: Building2 }, { k: "Video", icon: Video }].map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.k} onClick={() => setMode(m.k)}
                className={`h-11 rounded-xl border inline-flex items-center justify-center gap-2 text-[13.5px] font-medium ${mode === m.k ? "border-hx-red bg-hx-red/5 text-hx-red" : "border-hx-line bg-white text-hx-slate"}`}>
                <Icon className="w-4 h-4" /> {m.k}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-hx-muted mb-2">Your details — so the developer can confirm</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Your name" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
          <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="Phone number" inputMode="tel" className="h-11 px-3.5 rounded-xl border border-hx-line bg-hx-bg text-[14px] outline-none focus:border-hx-red/50" />
        </div>

        <button
          onClick={() => valid && onConfirm(days[dateIdx].full, slot, mode, buyerName.trim(), buyerPhone.trim())}
          disabled={!valid}
          className="mt-4 w-full h-12 rounded-2xl bg-hx-red text-white text-[15px] font-semibold shadow-hx-red inline-flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Check className="w-5 h-5" /> Confirm visit
        </button>
        <p className="mt-2 text-center text-[11px] text-hx-muted">Your number is shared only with this developer — never with brokers.</p>
      </div>
    </div>
  );
}
