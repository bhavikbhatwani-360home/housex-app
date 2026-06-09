"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Shield } from "lucide-react";

type Member = { id: string; email: string; name: string | null; role: string };

const ROLE_DESC: Record<string, string> = {
  owner: "Full access — manage team, properties, leads",
  manager: "Add & edit properties, handle leads",
  agent: "View & respond to leads only",
};

export default function TeamManager({ members, isOwner, meId }: { members: Member[]; isOwner: boolean; meId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "manager" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/developer/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (res.ok) { setF({ name: "", email: "", password: "", role: "manager" }); router.refresh(); }
      else setError(data.error || "Could not add member.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? They'll lose access immediately.`)) return;
    await fetch("/api/developer/team", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: id }) });
    router.refresh();
  };

  return (
    <div className="max-w-3xl">
      {/* member list */}
      <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
        {members.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-hx-line" : ""}`}>
            <span className="w-9 h-9 rounded-full bg-hx-ink text-white text-[12px] font-semibold inline-flex items-center justify-center shrink-0">
              {(m.name || m.email).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium truncate">{m.name || m.email} {m.id === meId && <span className="text-[11px] text-hx-muted">(you)</span>}</div>
              <div className="text-[12px] text-hx-muted truncate">{m.email}</div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-bg border border-hx-line text-[11.5px] font-semibold capitalize">
              <Shield className="w-3 h-3 text-hx-red" /> {m.role}
            </span>
            {isOwner && m.id !== meId && (
              <button onClick={() => remove(m.id, m.name || m.email)} className="w-8 h-8 rounded-lg text-hx-muted hover:text-hx-danger hover:bg-hx-bg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ))}
      </div>

      {/* add member (owner only) */}
      {isOwner && (
        <form onSubmit={add} className="mt-5 rounded-xl border border-hx-line bg-white p-5">
          <div className="text-[13px] font-semibold mb-3 flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-hx-red" /> Add a team member</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" className="h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50" />
            <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Work email" type="email" className="h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50" />
            <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Set a password (share with them)" className="h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50" />
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50">
              <option value="manager">Manager — add/edit properties</option>
              <option value="agent">Agent — leads only</option>
              <option value="owner">Owner — full access</option>
            </select>
          </div>
          <p className="mt-2 text-[11.5px] text-hx-muted">{ROLE_DESC[f.role]}</p>
          {error && <p className="mt-2 text-[12.5px] text-hx-danger">{error}</p>}
          <button type="submit" disabled={busy} className="mt-3 h-10 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-40 inline-flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> {busy ? "Adding…" : "Add member"}
          </button>
        </form>
      )}
    </div>
  );
}
