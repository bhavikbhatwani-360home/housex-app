"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Sparkles } from "lucide-react";

type UnitRow = { floor: string; priceLakh: string; facing: string; carpetSqft: string };
export type PropertyInitial = {
  id: string; name: string; city: string; locality: string; bhk: string; facing: string;
  carpetSqft: number; distanceToStationM: number; reraId: string; status: string;
  amenities: string[]; brochureUrl: string | null;
  description: string | null; possession: string | null; videoUrl: string | null; images: string[];
  units: { floor: number; priceLakh: number; facing: string; carpetSqft: number }[];
};

const FACINGS = ["East", "West", "North", "South"];
const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];
const STATUSES = ["Live", "Pending", "Draft"];

export default function EditForm({ initial }: { initial: PropertyInitial }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: initial.name, city: initial.city, locality: initial.locality, bhk: initial.bhk,
    facing: initial.facing, carpetSqft: String(initial.carpetSqft || ""), distanceToStationM: String(initial.distanceToStationM || ""),
    reraId: initial.reraId, status: initial.status, amenities: initial.amenities.join(", "), brochureUrl: initial.brochureUrl || "",
    videoUrl: initial.videoUrl || "", possession: initial.possession || "", description: initial.description || "", images: initial.images.join("\n"),
  });
  const [units, setUnits] = useState<UnitRow[]>(
    initial.units.length
      ? initial.units.map((u) => ({ floor: String(u.floor), priceLakh: String(u.priceLakh), facing: u.facing, carpetSqft: String(u.carpetSqft) }))
      : [{ floor: "", priceLakh: "", facing: "East", carpetSqft: "" }]
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setUnit = (i: number, k: keyof UnitRow, v: string) => setUnits((p) => p.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const addUnit = () => setUnits((p) => [...p, { floor: "", priceLakh: "", facing: f.facing, carpetSqft: f.carpetSqft }]);
  const removeUnit = (i: number) => setUnits((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  const prices = units.map((u) => Number(u.priceLakh)).filter((x) => x > 0);
  const range = useMemo(() => {
    if (prices.length === 0) return "—";
    const lo = Math.min(...prices), hi = Math.max(...prices);
    return lo === hi ? `₹${lo} L` : `₹${lo}–${hi} L`;
  }, [prices]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/developer/properties/${initial.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...f,
          carpetSqft: Number(f.carpetSqft),
          distanceToStationM: Number(f.distanceToStationM),
          amenities: f.amenities.split(",").map((a) => a.trim()).filter(Boolean),
          images: f.images.split("\n").map((x) => x.trim()).filter(Boolean),
          units: units.map((u) => ({ floor: Number(u.floor), priceLakh: Number(u.priceLakh), facing: u.facing, carpetSqft: Number(u.carpetSqft) })),
        }),
      });
      const data = await res.json();
      if (res.ok) { router.push("/developer/properties"); router.refresh(); }
      else setError(data.error || "Could not save.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${initial.name}"? This removes the listing and its units. Past visits/bookings are kept.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/developer/properties/${initial.id}`, { method: "DELETE" });
      if (res.ok) { router.push("/developer/properties"); router.refresh(); }
      else { const d = await res.json(); setError(d.error || "Could not delete."); setDeleting(false); }
    } catch {
      setError("Something went wrong."); setDeleting(false);
    }
  };

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6 gap-3 sticky top-0 z-10">
        <Link href="/developer/properties" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-[16px] font-semibold tracking-tight">Edit property</h1>
        <button form="editpropform" disabled={busy} className="ml-auto h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-40">{busy ? "Saving…" : "Save changes"}</button>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
        <form id="editpropform" onSubmit={submit} className="space-y-5">
          <Card title="Basics">
            <Grid>
              <Input label="Project name" value={f.name} onChange={set("name")} required />
              <Input label="City" value={f.city} onChange={set("city")} />
              <Input label="Locality" value={f.locality} onChange={set("locality")} required />
              <Select label="Configuration" value={f.bhk} onChange={set("bhk")} options={BHKS} />
              <Select label="Base facing" value={f.facing} onChange={set("facing")} options={FACINGS} />
              <Input label="Carpet area (sqft)" value={f.carpetSqft} onChange={set("carpetSqft")} type="number" />
              <Input label="Distance to station (m)" value={f.distanceToStationM} onChange={set("distanceToStationM")} type="number" />
            </Grid>
          </Card>

          <Card title="Units & pricing">
            <div className="space-y-2">
              <div className="grid grid-cols-[60px_1fr_1fr_1fr_36px] gap-2 text-[10.5px] uppercase tracking-wider text-hx-muted px-1">
                <span>Floor</span><span>Price (₹L)</span><span>Facing</span><span>Sqft</span><span></span>
              </div>
              {units.map((u, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_1fr_1fr_36px] gap-2 items-center">
                  <input value={u.floor} onChange={(e) => setUnit(i, "floor", e.target.value)} type="number" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <input value={u.priceLakh} onChange={(e) => setUnit(i, "priceLakh", e.target.value)} type="number" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <select value={u.facing} onChange={(e) => setUnit(i, "facing", e.target.value)} className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] outline-none focus:border-hx-red/50">
                    {FACINGS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <input value={u.carpetSqft} onChange={(e) => setUnit(i, "carpetSqft", e.target.value)} type="number" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <button type="button" onClick={() => removeUnit(i)} className="w-9 h-9 rounded-lg text-hx-muted hover:text-hx-danger hover:bg-hx-bg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addUnit} className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-hx-red hover:underline"><Plus className="w-4 h-4" /> Add unit</button>
            </div>
          </Card>

          <Card title="Media & overview">
            <Grid>
              <Input label="Video tour — YouTube link" value={f.videoUrl} onChange={set("videoUrl")} full />
              <Input label="Possession" value={f.possession} onChange={set("possession")} />
            </Grid>
            <label className="block mt-3.5">
              <span className="text-[12px] font-medium text-hx-slate mb-1 block">Description</span>
              <textarea value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50 resize-none" />
            </label>
            <label className="block mt-3.5">
              <span className="text-[12px] font-medium text-hx-slate mb-1 block">Photo URLs — one per line</span>
              <textarea value={f.images} onChange={(e) => setF((p) => ({ ...p, images: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50 resize-none" />
            </label>
          </Card>

          <Card title="Legal & details">
            <Grid>
              <Input label="RERA number" value={f.reraId} onChange={set("reraId")} />
              <Select label="Status" value={f.status} onChange={set("status")} options={STATUSES} />
              <Input label="Brochure URL (optional)" value={f.brochureUrl} onChange={set("brochureUrl")} full />
              <Input label="Amenities (comma separated)" value={f.amenities} onChange={set("amenities")} full />
            </Grid>
          </Card>

          {error && <p className="text-[13px] text-hx-danger">{error}</p>}

          <button type="button" onClick={remove} disabled={deleting} className="text-[13px] font-medium text-hx-danger hover:underline inline-flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting…" : "Delete this property"}
          </button>
        </form>

        <div className="lg:sticky lg:top-20 h-fit">
          <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-hx-red" /> How Baba sees it</div>
          <div className="rounded-xl border border-hx-line bg-white p-4">
            <div className="text-[15px] font-semibold tracking-tight">{f.name || "Project name"}</div>
            <div className="text-[12px] text-hx-muted">{f.locality || "Locality"}</div>
            <div className="mt-2 flex items-center gap-2 text-[13px]">
              <span className="num font-semibold">{range}</span><span className="text-hx-muted">·</span><span>{f.bhk}</span><span className="text-hx-muted">·</span><span>{f.facing}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-hx-line bg-white p-5"><div className="text-[13px] font-semibold mb-3.5">{title}</div>{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">{children}</div>;
}
function Input({ label, full, ...props }: { label: string; full?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[12px] font-medium text-hx-slate mb-1 block">{label}</span>
      <input {...props} className="w-full h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50" />
    </label>
  );
}
function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-hx-slate mb-1 block">{label}</span>
      <select {...props} className="w-full h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}
