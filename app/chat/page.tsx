"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, Plus, House, IndianRupee, Compass, CalendarCheck } from "lucide-react";

type Msg =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "baba"; html: string };

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

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(0);
  const empty = messages.length === 0;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const send = async (raw: string) => {
    const txt = raw.trim();
    if (!txt || typing) return;
    const history = messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.role === "user" ? m.text : htmlToText(m.html),
    }));
    setMessages((m) => [...m, { id: ++idRef.current, role: "user", text: txt }]);
    setInput("");
    requestAnimationFrame(autoGrow);
    setTyping(true);
    try {
      const res = await fetch("/api/baba", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content: txt }] }),
      });
      const data = await res.json();
      setTyping(false);
      setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html: formatReply(data.reply || "") }]);
    } catch {
      setTyping(false);
      setMessages((m) => [...m, { id: ++idRef.current, role: "baba", html: babaReplyFallback(txt) }]);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setTyping(false);
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
            <div className="text-[14px] font-semibold tracking-tight flex items-center gap-1.5">
              Baba
              <span className="text-[9px] font-bold uppercase tracking-wider text-hx-red bg-hx-red/10 rounded px-1.5 py-[1px]">AI</span>
            </div>
            <div className="text-[11px] text-hx-muted -mt-0.5">HouseX · home assistant</div>
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
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-hx-bg border border-hx-line px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <span className="w-7 h-7 rounded-lg bg-hx-red inline-flex items-center justify-center shrink-0 mt-0.5 shadow-hx-red">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-[12px] font-semibold text-hx-muted mb-1">Baba</div>
                    <div className="text-[15px] leading-relaxed text-hx-ink" dangerouslySetInnerHTML={{ __html: m.html }} />
                  </div>
                </div>
              )
            )}
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
              placeholder="Message Baba…"
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
            Baba helps you find RERA-verified homes · Hindi · Marathi · English · Replies can have mistakes — verify key details.
          </p>
        </div>
      </div>
    </div>
  );
}
