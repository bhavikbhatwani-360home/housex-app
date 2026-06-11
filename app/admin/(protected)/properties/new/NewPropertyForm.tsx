"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Sparkles, Briefcase, Camera, Loader2, X } from "lucide-react";

type UnitRow = { floor: string; priceLakh: string; facing: string; carpetSqft: string };
type DevOption = { id: string; company: string };
type FormState = {
  name: string; developer: string; city: string; locality: string; bhk: string; facing: string;
  carpetSqft: string; distanceToStationM: string; reraId: string; status: string; amenities: string; brochureUrl: string;
  videoUrl: string; possession: string; description: string; images: string;
  totalTowers: string; totalUnits: string; projectArea: string; totalFloors: string; floorPlans: string; nearby: string;
};

const FACINGS = ["East", "West", "North", "South"];
const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];
const STATUSES = ["Live", "Pending", "Draft"];

const EMPTY_FORM: FormState = {
  name: "", developer: "", city: "Mumbai (MMR)", locality: "", bhk: "2 BHK", facing: "East",
  carpetSqft: "", distanceToStationM: "", reraId: "", status: "Live", amenities: "", brochureUrl: "",
  videoUrl: "", possession: "", description: "", images: "",
  totalTowers: "", totalUnits: "", projectArea: "", totalFloors: "", floorPlans: "", nearby: "",
};

export default function NewPropertyForm({
  developers, initial, initialUnits, propertyId, initialDeveloperId, nextPendingId,
}: {
  developers: DevOption[];
  initial?: Partial<FormState>;
  initialUnits?: UnitRow[];
  propertyId?: string;
  initialDeveloperId?: string;
  nextPendingId?: string | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(propertyId);
  const [developerId, setDeveloperId] = useState(initialDeveloperId ?? developers[0]?.id ?? "");
  const [f, setF] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [units, setUnits] = useState<UnitRow[]>(
    initialUnits && initialUnits.length ? initialUnits : [{ floor: "", priceLakh: "", facing: "East", carpetSqft: "" }]
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ── photos & floor plans, uploaded straight to the listing ──
  const photoRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [imgBusy, setImgBusy] = useState(false);

  // Resize an image client-side to keep stored photos light (~1600px JPEG).
  const resizeImage = (file: File, maxDim = 1600, quality = 0.82) =>
    new Promise<string>((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const m = Math.max(width, height);
        if (m > maxDim) { const s = maxDim / m; width = Math.round(width * s); height = Math.round(height * s); }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load")); };
      img.src = url;
    });

  // Upload photos / floor plans straight into the listing's galleries.
  const addImages = async (files: FileList | null, target: "photos" | "plans") => {
    if (!files || files.length === 0) return;
    setImgBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).slice(0, 12).map((fl) => resizeImage(fl)));
      if (target === "photos") setPhotos((p) => [...p, ...urls]);
      else setPlans((p) => [...p, ...urls]);
    } catch {
      // ignore — a bad file just doesn't get added
    } finally {
      setImgBusy(false);
      if (photoRef.current) photoRef.current.value = "";
      if (planRef.current) planRef.current.value = "";
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const setUnit = (i: number, k: keyof UnitRow, v: string) =>
    setUnits((p) => p.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const addUnit = () => setUnits((p) => [...p, { floor: "", priceLakh: "", facing: f.facing, carpetSqft: f.carpetSqft }]);
  const removeUnit = (i: number) => setUnits((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  const prices = units.map((u) => Number(u.priceLakh)).filter((x) => x > 0);
  const range = useMemo(() => {
    if (prices.length === 0) return "—";
    const lo = Math.min(...prices), hi = Math.max(...prices);
    return lo === hi ? `₹${lo} L` : `₹${lo}–${hi} L`;
  }, [prices]);

  const devLabel = developerId
    ? developers.find((d) => d.id === developerId)?.company || ""
    : f.developer || "Developer";

  // Upload brochure photos to blob storage (if configured) and get back URLs;
  // falls back to the data URLs unchanged if storage isn't set up.
  const hostPhotos = async (urls: string[]): Promise<string[]> => {
    if (!urls.some((u) => u.startsWith("data:"))) return urls;
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ images: urls }),
      });
      if (res.ok) return (await res.json()).urls as string[];
    } catch {}
    return urls;
  };

  const save = async (goNext: boolean) => {
    setError("");
    setBusy(true);
    try {
      const manualImgs = f.images.split("\n").map((x) => x.trim()).filter(Boolean);
      const manualPlans = f.floorPlans.split("\n").map((x) => x.trim()).filter(Boolean);
      const [images, floorPlans] = await Promise.all([
        hostPhotos([...photos, ...manualImgs]),
        hostPhotos([...plans, ...manualPlans]),
      ]);
      const res = await fetch(isEdit ? `/api/admin/properties/${propertyId}` : "/api/admin/properties", {
        method: isEdit ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...f,
          developerId: developerId || undefined,
          carpetSqft: Number(f.carpetSqft),
          distanceToStationM: Number(f.distanceToStationM),
          amenities: f.amenities.split(",").map((a) => a.trim()).filter(Boolean),
          images,
          floorPlans,
          nearby: f.nearby.split("\n").map((x) => x.trim()).filter(Boolean),
          units: units.map((u) => ({
            floor: Number(u.floor), priceLakh: Number(u.priceLakh),
            facing: u.facing, carpetSqft: Number(u.carpetSqft),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(goNext && nextPendingId ? `/admin/properties/${nextPendingId}/edit` : "/admin/properties");
        router.refresh();
      } else setError(data.error || "Could not save.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save(false);
  };

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-3 sm:px-6 gap-2 sm:gap-3 sticky top-0 z-10">
        <Link href="/admin/properties" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-[15px] sm:text-[16px] font-semibold tracking-tight truncate min-w-0">{isEdit ? "Edit property" : "Add property"}</h1>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button form="adminpropform" disabled={busy} className="h-9 px-3 sm:px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-40">
            {busy ? "Saving…" : isEdit ? "Save" : "Publish"}
          </button>
          {isEdit && nextPendingId && (
            <button type="button" onClick={() => save(true)} disabled={busy} className="h-9 px-3 sm:px-4 rounded-lg bg-hx-ink text-white text-[13px] font-semibold disabled:opacity-40 inline-flex items-center gap-1.5">
              <span className="hidden sm:inline">Save &amp;&nbsp;</span>next →
            </button>
          )}
        </div>
      </header>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
        <form id="adminpropform" onSubmit={submit} className="space-y-5">
          <Card title="On behalf of developer">
            <label className="block">
              <span className="text-[12px] font-medium text-hx-slate mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-hx-red" /> Developer account</span>
              <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50">
                {developers.map((d) => <option key={d.id} value={d.id}>{d.company}</option>)}
                <option value="">No account yet — type the name below</option>
              </select>
            </label>
            {developerId === "" && (
              <div className="mt-3">
                <Input label="Developer name (no account)" value={f.developer} onChange={set("developer")} placeholder="Square Homes" />
              </div>
            )}
            <p className="mt-2 text-[11.5px] text-hx-muted">
              {developerId
                ? "Leads and visits from this listing will route to this developer's CRM automatically."
                : "Without an account, leads stay in the operator console only — they won't route to a developer CRM."}
            </p>
          </Card>

          <Card title="Basics">
            <Grid>
              <Input label="Project name" value={f.name} onChange={set("name")} placeholder="Greenvalley" required />
              <Input label="City" value={f.city} onChange={set("city")} />
              <Input label="Locality" value={f.locality} onChange={set("locality")} placeholder="Virar West" required />
              <Select label="Configuration" value={f.bhk} onChange={set("bhk")} options={BHKS} />
              <Select label="Base facing" value={f.facing} onChange={set("facing")} options={FACINGS} />
              <Input label="Carpet area (sqft)" value={f.carpetSqft} onChange={set("carpetSqft")} type="number" placeholder="720" />
              <Input label="Distance to station (m)" value={f.distanceToStationM} onChange={set("distanceToStationM")} type="number" placeholder="800" />
            </Grid>
          </Card>

          <Card title="Units & pricing">
            <div className="space-y-2">
              <div className="grid grid-cols-[60px_1fr_1fr_1fr_36px] gap-2 text-[10.5px] uppercase tracking-wider text-hx-muted px-1">
                <span>Floor</span><span>Price (₹L)</span><span>Facing</span><span>Sqft</span><span></span>
              </div>
              {units.map((u, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_1fr_1fr_36px] gap-2 items-center">
                  <input value={u.floor} onChange={(e) => setUnit(i, "floor", e.target.value)} type="number" placeholder="1" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <input value={u.priceLakh} onChange={(e) => setUnit(i, "priceLakh", e.target.value)} type="number" placeholder="54" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <select value={u.facing} onChange={(e) => setUnit(i, "facing", e.target.value)} className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] outline-none focus:border-hx-red/50">
                    {FACINGS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                  <input value={u.carpetSqft} onChange={(e) => setUnit(i, "carpetSqft", e.target.value)} type="number" placeholder="720" className="h-9 px-2 rounded-lg border border-hx-line bg-hx-bg text-[13px] num outline-none focus:border-hx-red/50" />
                  <button type="button" onClick={() => removeUnit(i)} className="w-9 h-9 rounded-lg text-hx-muted hover:text-hx-danger hover:bg-hx-bg inline-flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addUnit} className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-hx-red hover:underline">
                <Plus className="w-4 h-4" /> Add unit
              </button>
            </div>
          </Card>

          <Card title="Media & overview">
            <Grid>
              <Input label="Video tour — YouTube link" value={f.videoUrl} onChange={set("videoUrl")} placeholder="https://youtube.com/watch?v=…" full />
              <Input label="Possession" value={f.possession} onChange={set("possession")} placeholder="Ready to move / Dec 2026" />
            </Grid>
            <Textarea label="Description" value={f.description} onChange={(v) => setF((p) => ({ ...p, description: v }))} rows={3} placeholder="A short overview buyers will read…" />

            {/* ── photo upload ── */}
            <div className="mt-3.5">
              <span className="text-[12px] font-medium text-hx-slate mb-1.5 block">Photos {photos.length > 0 && <span className="text-hx-muted">· {photos.length}</span>}</span>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addImages(e.target.files, "photos")} className="hidden" />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={imgBusy}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-50">
                {imgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Upload photos
              </button>
              <span className="ml-2 text-[11px] text-hx-muted">JPG / PNG — the first one is the cover</span>
              {photos.length > 0 && <ThumbStrip label="" srcs={photos} onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))} />}
            </div>

            {/* ── floor plan upload ── */}
            <div className="mt-4">
              <span className="text-[12px] font-medium text-hx-slate mb-1.5 block">Floor plans {plans.length > 0 && <span className="text-hx-muted">· {plans.length}</span>}</span>
              <input ref={planRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addImages(e.target.files, "plans")} className="hidden" />
              <button type="button" onClick={() => planRef.current?.click()} disabled={imgBusy}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold hover:bg-hx-bg disabled:opacity-50">
                {imgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Upload floor plans
              </button>
              {plans.length > 0 && <ThumbStrip label="" srcs={plans} onRemove={(i) => setPlans((p) => p.filter((_, j) => j !== i))} />}
            </div>
          </Card>

          <Card title="Project details & location">
            <Grid>
              <Input label="Total towers" value={f.totalTowers} onChange={set("totalTowers")} type="number" placeholder="4" />
              <Input label="Total units" value={f.totalUnits} onChange={set("totalUnits")} type="number" placeholder="320" />
              <Input label="Project area" value={f.projectArea} onChange={set("projectArea")} placeholder="3.5 acres" />
              <Input label="Floors" value={f.totalFloors} onChange={set("totalFloors")} placeholder="G+14" />
            </Grid>
            <Textarea label="What's nearby — one per line: Category, Name, Distance" value={f.nearby} onChange={(v) => setF((p) => ({ ...p, nearby: v }))} rows={4} placeholder={"School, DAV Public School, 600 m\nHospital, Apex Hospital, 1.2 km\nMarket, D-Mart, 800 m"} />
          </Card>

          <Card title="Legal & details">
            <Grid>
              <Input label="RERA number" value={f.reraId} onChange={set("reraId")} placeholder="P51700012345" />
              <Select label="Status" value={f.status} onChange={set("status")} options={STATUSES} />
              <Input label="Brochure URL (optional)" value={f.brochureUrl} onChange={set("brochureUrl")} placeholder="https://…" full />
              <Input label="Amenities (comma separated)" value={f.amenities} onChange={set("amenities")} placeholder="Covered parking, Gym, Kids' play area" full />
            </Grid>
          </Card>

          {error && <p className="text-[13px] text-hx-danger">{error}</p>}
        </form>

        {/* live preview */}
        <div className="hidden lg:block lg:sticky lg:top-20 h-fit">
          <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-hx-red" /> How HouseX AI sees it
          </div>
          <div className="rounded-xl border border-hx-line bg-white p-4">
            <div className="text-[15px] font-semibold tracking-tight">{f.name || "Project name"}</div>
            <div className="text-[12px] text-hx-muted">{devLabel} · {f.locality || "Locality"}</div>
            <div className="mt-2 flex items-center gap-2 text-[13px]">
              <span className="num font-semibold">{range}</span>
              <span className="text-hx-muted">·</span>
              <span>{f.bhk}</span>
              <span className="text-hx-muted">·</span>
              <span>{f.facing}</span>
            </div>
            <p className="mt-3 pt-3 border-t border-hx-line text-[11.5px] text-hx-muted leading-relaxed">
              {developerId
                ? `Published on behalf of ${devLabel} — their CRM receives every lead from this listing.`
                : "Platform listing — leads stay in the operator console."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hx-line bg-white p-4 sm:p-5">
      <div className="text-[13px] font-semibold mb-3.5">{title}</div>
      {children}
    </div>
  );
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
function Textarea({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows: number; placeholder?: string }) {
  return (
    <label className="block mt-3.5">
      <span className="text-[12px] font-medium text-hx-slate mb-1 block">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50 resize-none" />
    </label>
  );
}
function ThumbStrip({ label, srcs, onRemove }: { label: string; srcs: string[]; onRemove: (i: number) => void }) {
  return (
    <div className="mt-3.5">
      <span className="text-[12px] font-medium text-hx-slate mb-1.5 block">{label}</span>
      <div className="flex flex-wrap gap-2">
        {srcs.map((src, i) => (
          <div key={i} className="relative w-[88px] h-[66px] rounded-lg overflow-hidden border border-hx-line group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onRemove(i)} aria-label="Remove"
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
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
