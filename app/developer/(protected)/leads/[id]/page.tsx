import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, Phone, Home } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";
import LeadReply from "./LeadReply";
import SendOffer from "./SendOffer";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function DevLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const dev = await getDeveloper();
  if (!dev) return null;
  const { id } = await params;

  let lead;
  try {
    lead = await prisma.lead.findFirst({
      where: { id, developerId: dev.id },
      include: { conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } } },
    });
  } catch {
    lead = null;
  }
  if (!lead) notFound();
  const messages = lead.conversation?.messages ?? [];

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6 gap-3">
        <Link href="/developer/leads" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-[15px] font-semibold tracking-tight line-clamp-1">{lead.intent || "Lead"}</h1>
        <span className="ml-auto text-[12px] num text-hx-muted">{fmt(lead.createdAt)}</span>
      </header>

      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-hx-line bg-white p-4 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
          <Field label="Status" value={lead.status} />
          <Field label="Interested in" value={lead.interestedProperty || "—"} icon={<Home className="w-3.5 h-3.5" />} />
          <Field label="Budget" value={lead.budgetLakh ? `₹${lead.budgetLakh} L` : "—"} />
          <Field label="Phone" value={lead.phone || "—"} icon={<Phone className="w-3.5 h-3.5" />} />
        </div>

        <div className="text-[12px] uppercase tracking-wider text-hx-muted mb-3 font-medium">Conversation · {messages.length} messages</div>
        <div className="space-y-4 mb-5">
          {messages.length === 0 && <p className="text-[13px] text-hx-muted">No messages yet. Send the first reply below.</p>}
          {messages.map((m) => {
            if (m.role === "developer") {
              // our team's message — right side
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl rounded-br-md bg-hx-red text-white px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap shadow-hx-red">{m.content}</div>
                    {m.senderName && <div className="text-[10.5px] text-hx-muted text-right mt-1">{m.senderName}</div>}
                  </div>
                </div>
              );
            }
            if (m.role === "user") {
              // the buyer — left side
              return (
                <div key={m.id} className="flex gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-hx-ink text-white text-[9px] font-bold inline-flex items-center justify-center shrink-0 mt-0.5">B</span>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-hx-bg border border-hx-line px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</div>
                </div>
              );
            }
            // Baba (AI) — left side
            return (
              <div key={m.id} className="flex gap-2.5">
                <span className="w-6 h-6 rounded-md bg-hx-red inline-flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-3 h-3 text-white" /></span>
                <div className="max-w-[80%]">
                  <div className="text-[10.5px] font-semibold text-hx-muted mb-0.5">Baba AI</div>
                  <div className="text-[14px] leading-relaxed text-hx-ink whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            );
          })}
        </div>

        <LeadReply leadId={lead.id} />
        <div className="mt-3"><SendOffer leadId={lead.id} /></div>
        <p className="mt-2 text-[11.5px] text-hx-muted">Your reply &amp; offers appear directly in the buyer&apos;s Baba chat, as your company.</p>
      </div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wider text-hx-muted flex items-center gap-1">{icon}{label}</div>
      <div className="text-[13.5px] font-medium mt-0.5">{value}</div>
    </div>
  );
}
