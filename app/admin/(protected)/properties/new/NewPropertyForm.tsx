"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Sparkles, Briefcase, Camera, Loader2, X, Eye, RotateCcw, Flame, Tag, MapPin, BadgeCheck, Lock, Check, Star, ZoomIn, FileText, ExternalLink, Play, Image as ImageIcon } from "lucide-react";

type UnitRow = { floor: string; priceLakh: string; listPriceLakh: string; tag: string; facing: string; carpetSqft: string };
type DevOption = { id: string; company: string };
type FormState = {
  name: string; developer: string; city: string; locality: string; bhk: string; facing: string;
  carpetSqft: string; distanceToStationM: string; reraId: string; status: string; amenities: string; brochureUrl: string;
  videoUrl: string; possession: string; description: string; images: string; offerNote: string;
  totalTowers: string; totalUnits: string; projectArea: string; totalFloors: string; floorPlans: string; nearby: string;
};

const FACINGS = ["East", "West", "North", "South"];
const BHKS = ["1 BHK", "2 BHK", "3 BHK", "3+ BHK"];
const STATUSES = ["Live", "Pending", "Draft"];

const EMPTY_FORM: FormState = {
  name: "", developer: "", city: "Mumbai (MMR)", locality: "", bhk: "2 BHK", facing: "East",
  carpetSqft: "", distanceToStationM: "", reraId: "", status: "Live", amenities: "", brochureUrl: "",
  videoUrl: "", possession: "", description: "", images: "", offerNote: "",
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
    initialUnits && initialUnits.length ? initialUnits : [{ floor: "", priceLakh: "", listPriceLakh: "", tag: "", facing: "East", carpetSqft: "" }]
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null); // tap-to-enlarge

  // ── photos & floor plans, uploaded straight to the listing ──
  const photoRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);
  const broRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [plans, setPlans] = useState<string[]>([]);
  const [broBusy, setBroBusy] = useState(false);
  const [broErr, setBroErr] = useState("");

  // ── draft auto-save (so nothing is ever lost if the phone reloads the page,
  //    the camera kills the tab, or a save fails). Restored on next visit. ──
  const draftKey = `hx:propdraft:${propertyId ?? "new"}`;
  const [recovered, setRecovered] = useState(false);
  const loadedRef = useRef(false);

  // restore a saved draft once, on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.f) setF((p) => ({ ...p, ...d.f }));
        if (Array.isArray(d.units) && d.units.length) setUnits(d.units);
        if (Array.isArray(d.photos)) setPhotos(d.photos);
        if (Array.isArray(d.plans)) setPlans(d.plans);
        if (typeof d.developerId === "string") setDeveloperId(d.developerId);
        setRecovered(true);
      }
    } catch {
      /* corrupt / unavailable storage — ignore */
    }
    loadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist the draft on every change (debounced). Text always saves; photos are
  // attempted but dropped first if they blow the storage quota — typed details
  // (the painful thing to lose) are never sacrificed.
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      const write = (withMedia: boolean) =>
        localStorage.setItem(
          draftKey,
          JSON.stringify({ f, units, developerId, ...(withMedia ? { photos, plans } : {}), savedAt: Date.now() })
        );
      try {
        write(true);
      } catch {
        try { write(false); } catch { /* give up silently */ }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [f, units, photos, plans, developerId, draftKey]);

  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch {} };
  const discardDraft = () => { clearDraft(); window.location.reload(); };
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

  // move a photo to the front so it becomes the cover buyers see first
  const makeCover = (i: number) =>
    setPhotos((p) => (i <= 0 ? p : [p[i], ...p.slice(0, i), ...p.slice(i + 1)]));

  // read a file as a data URL (brochure PDFs aren't resized like photos)
  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read"));
      r.readAsDataURL(file);
    });

  // Brochure upload: PDFs need Blob storage; image brochures can fall back inline.
  const uploadBrochure = async (file: File | undefined) => {
    if (!file) return;
    setBroErr(""); setBroBusy(true);
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (file.size > 25 * 1024 * 1024) { setBroErr("That file is over 25 MB — please use a smaller brochure."); return; }
      const data = await fileToDataUrl(file);
      const res = await fetch("/api/admin/upload", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: [data] }),
      });
      const j = await res.json();
      const url: string | undefined = j?.urls?.[0];
      if (url && (j.hosted || !isPdf)) {
        setF((p) => ({ ...p, brochureUrl: url }));
      } else {
        setBroErr("PDF upload needs file storage turned on. For now, paste a brochure link below.");
      }
    } catch {
      setBroErr("Couldn't upload the brochure — try again or paste a link below.");
    } finally {
      setBroBusy(false);
      if (broRef.current) broRef.current.value = "";
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const setUnit = (i: number, k: keyof UnitRow, v: string) =>
    setUnits((p) => p.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const addUnit = () => setUnits((p) => [...p, { floor: "", priceLakh: "", listPriceLakh: "", tag: "", facing: f.facing, carpetSqft: f.carpetSqft }]);
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

  // ── "ready to publish" checklist — what a listing needs before it can go Live ──
  const hasPricedUnit = units.some((u) => Number(u.priceLakh) > 0);
  const hasDeveloper = Boolean(developerId) || f.developer.trim().length > 0;
  const checklist = [
    { label: "Project name", ok: f.name.trim().length > 0, need: true },
    { label: "Locality", ok: f.locality.trim().length > 0, need: true },
    { label: "Developer", ok: hasDeveloper, need: true },
    { label: "A unit with a price", ok: hasPricedUnit, need: true },
    { label: "At least one photo", ok: photos.length > 0 || f.images.trim().length > 0, need: true },
    { label: "RERA number", ok: f.reraId.trim().length > 0, need: false },
    { label: "Cover-worthy: 3+ photos", ok: photos.length >= 3, need: false },
  ];
  const missingRequired = checklist.filter((c) => c.need && !c.ok);
  const readyToLive = missingRequired.length === 0;

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
            listPriceLakh: Number(u.listPriceLakh) || 0, tag: u.tag.trim(),
            facing: u.facing, carpetSqft: Number(u.carpetSqft),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearDraft(); // saved for real — drop the local recovery copy
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
          <button type="button" onClick={() => setShowPreview(true)} className="h-9 px-3 sm:px-4 rounded-lg border border-hx-line text-hx-ink text-[13px] font-semibold hover:bg-hx-bg inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Preview
          </button>
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

      {recovered && (
        <div className="bg-hx-warning/10 border-b border-hx-warning/30 px-4 sm:px-6 py-2.5 flex items-center gap-2 text-[12.5px]">
          <RotateCcw className="w-4 h-4 text-hx-warning shrink-0" />
          <span className="text-hx-ink">Recovered your unsaved details from last time — keep editing and Save when ready.</span>
          <button type="button" onClick={discardDraft} className="ml-auto shrink-0 text-[12px] font-semibold text-hx-slate hover:text-hx-danger underline">
            Discard
          </button>
        </div>
      )}

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
            <p className="-mt-1.5 mb-3 text-[11.5px] text-hx-muted leading-relaxed">
              <strong className="text-hx-slate">Offer ₹L</strong> is what the buyer pays. Add a higher <strong className="text-hx-slate">List ₹L</strong> to show
              a struck-through price and a <span className="text-hx-success font-semibold">“Save”</span> tag — only use a real, honest marked price.
            </p>
            <div className="space-y-2.5">
              {units.map((u, i) => {
                const sv = Number(u.listPriceLakh) - Number(u.priceLakh);
                return (
                  <div key={i} className="rounded-xl border border-hx-line bg-hx-bg/40 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-hx-slate">Unit {i + 1}{sv > 0 && Number(u.priceLakh) > 0 ? <span className="ml-1.5 text-hx-success">· save ₹{sv} L</span> : ""}</span>
                      <button type="button" onClick={() => removeUnit(i)} className="w-7 h-7 -mr-1 rounded-lg text-hx-muted hover:text-hx-danger hover:bg-white inline-flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <UField label="Floor" value={u.floor} onChange={(v) => setUnit(i, "floor", v)} type="number" placeholder="1" />
                      <UField label="Offer ₹L" value={u.priceLakh} onChange={(v) => setUnit(i, "priceLakh", v)} type="number" placeholder="31" />
                      <UField label="List ₹L" value={u.listPriceLakh} onChange={(v) => setUnit(i, "listPriceLakh", v)} type="number" placeholder="35" />
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-2 mt-2">
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-hx-muted mb-1 block">Facing</span>
                        <select value={u.facing} onChange={(e) => setUnit(i, "facing", e.target.value)} className="w-full h-9 px-2 rounded-lg border border-hx-line bg-white text-[13px] outline-none focus:border-hx-red/50">
                          {FACINGS.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </label>
                      <UField label="Sqft" value={u.carpetSqft} onChange={(v) => setUnit(i, "carpetSqft", v)} type="number" placeholder="420" />
                      <UField label="Tag (optional)" value={u.tag} onChange={(v) => setUnit(i, "tag", v)} placeholder="Garden view" />
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={addUnit} className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-hx-red hover:underline">
                <Plus className="w-4 h-4" /> Add unit
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-hx-line">
              <Input label="Offer banner (optional) — shown above the units" value={f.offerNote} onChange={set("offerNote")} placeholder="Limited launch pricing — only a few units left" full />
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
              <span className="text-[12px] font-medium text-hx-slate mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-hx-red" /> Photos {photos.length > 0 && <span className="text-hx-success font-semibold">· {photos.length} added ✓</span>}
              </span>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addImages(e.target.files, "photos")} className="hidden" />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={imgBusy}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-50">
                {imgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {photos.length ? "Add more" : "Upload photos"}
              </button>
              <span className="ml-2 text-[11px] text-hx-muted">JPG / PNG — tap a photo to enlarge; star = cover</span>
              {photos.length > 0 && (
                <MediaGrid srcs={photos} onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))} onView={setLightbox} onMakeCover={makeCover} showCover />
              )}
            </div>

            {/* ── floor plan upload ── */}
            <div className="mt-4">
              <span className="text-[12px] font-medium text-hx-slate mb-1.5 block">Floor plans {plans.length > 0 && <span className="text-hx-success font-semibold">· {plans.length} added ✓</span>}</span>
              <input ref={planRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addImages(e.target.files, "plans")} className="hidden" />
              <button type="button" onClick={() => planRef.current?.click()} disabled={imgBusy}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold hover:bg-hx-bg disabled:opacity-50">
                {imgBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} {plans.length ? "Add more" : "Upload floor plans"}
              </button>
              {plans.length > 0 && (
                <MediaGrid srcs={plans} onRemove={(i) => setPlans((p) => p.filter((_, j) => j !== i))} onView={setLightbox} />
              )}
            </div>

            {/* ── brochure upload ── */}
            <div className="mt-4">
              <span className="text-[12px] font-medium text-hx-slate mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-hx-red" /> Brochure (PDF or photo)</span>
              <input ref={broRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => uploadBrochure(e.target.files?.[0])} className="hidden" />
              {f.brochureUrl ? (
                <div className="flex items-center gap-2 rounded-lg border border-hx-line bg-hx-bg/60 px-3 py-2">
                  <FileText className="w-4 h-4 text-hx-red shrink-0" />
                  <span className="text-[12.5px] font-medium truncate flex-1">Brochure attached</span>
                  <a href={f.brochureUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-hx-red inline-flex items-center gap-1 shrink-0"><ExternalLink className="w-3.5 h-3.5" /> View</a>
                  <button type="button" onClick={() => setF((p) => ({ ...p, brochureUrl: "" }))} className="w-7 h-7 rounded-lg text-hx-muted hover:text-hx-danger inline-flex items-center justify-center shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => broRef.current?.click()} disabled={broBusy}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold hover:bg-hx-bg disabled:opacity-50">
                    {broBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Upload brochure
                  </button>
                  <span className="ml-2 text-[11px] text-hx-muted">or paste a link below</span>
                  <input value={f.brochureUrl} onChange={set("brochureUrl")} placeholder="https://…/brochure.pdf" className="mt-2 w-full h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50" />
                </>
              )}
              {broErr && <p className="mt-1.5 text-[12px] text-hx-warning">{broErr}</p>}
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
              <Input label="Amenities (comma separated)" value={f.amenities} onChange={set("amenities")} placeholder="Covered parking, Gym, Kids' play area" full />
            </Grid>
          </Card>

          <Card title="Ready to publish?">
            <div className={`rounded-lg px-3 py-2 mb-3 text-[12.5px] font-medium ${readyToLive ? "bg-hx-success/10 text-hx-success" : "bg-hx-warning/10 text-hx-ink"}`}>
              {readyToLive
                ? "All set — this listing can go Live."
                : `${missingRequired.length} thing${missingRequired.length > 1 ? "s" : ""} still needed before it can go Live.`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[12.5px]">
                  {c.ok
                    ? <Check className="w-4 h-4 text-hx-success shrink-0" />
                    : <span className={`w-4 h-4 rounded-full border shrink-0 ${c.need ? "border-hx-danger/60" : "border-hx-line"}`} />}
                  <span className={c.ok ? "text-hx-slate" : c.need ? "text-hx-ink font-medium" : "text-hx-muted"}>
                    {c.label}{!c.need && <span className="text-hx-muted font-normal"> · nice to have</span>}
                  </span>
                </div>
              ))}
            </div>
            {f.status === "Live" && !readyToLive && (
              <p className="mt-3 text-[12px] text-hx-warning">You&apos;ve set status to Live, but it&apos;ll be rejected until the required items above are filled.</p>
            )}
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
          <button type="button" onClick={() => setShowPreview(true)} className="mt-2.5 w-full h-10 rounded-lg border border-hx-line text-[13px] font-semibold text-hx-ink hover:bg-hx-bg inline-flex items-center justify-center gap-1.5">
            <Eye className="w-4 h-4 text-hx-red" /> See how the page looks
          </button>
        </div>
      </div>

      {showPreview && (
        <BuyerPreview
          onClose={() => setShowPreview(false)}
          name={f.name} developer={devLabel} locality={f.locality} city={f.city}
          bhk={f.bhk} facing={f.facing} reraId={f.reraId} status={f.status}
          offerNote={f.offerNote}
          photos={[...photos, ...f.images.split("\n").map((x) => x.trim()).filter(Boolean)]}
          plans={[...plans, ...f.floorPlans.split("\n").map((x) => x.trim()).filter(Boolean)]}
          videoUrl={f.videoUrl} brochureUrl={f.brochureUrl} description={f.description}
          amenities={f.amenities.split(",").map((a) => a.trim()).filter(Boolean)}
          units={units.map((u) => ({
            floor: Number(u.floor) || 0, facing: u.facing, carpetSqft: Number(u.carpetSqft) || 0,
            priceLakh: Number(u.priceLakh) || 0, listPriceLakh: Number(u.listPriceLakh) || 0, tag: u.tag.trim(),
          })).filter((u) => u.priceLakh > 0)}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white inline-flex items-center justify-center"><X className="w-5 h-5" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// A realistic, mobile-friendly preview of how this listing will look to a buyer
// on the public property page — built live from the form, so Pawan can check it
// before saving (and on his phone).
type PUnit = { floor: number; facing: string; carpetSqft: number; priceLakh: number; listPriceLakh: number; tag: string };
function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function BuyerPreview({
  onClose, name, developer, locality, city, bhk, facing, reraId, status, offerNote, photos, plans, videoUrl, brochureUrl, description, amenities, units,
}: {
  onClose: () => void; name: string; developer: string; locality: string; city: string; bhk: string; facing: string;
  reraId: string; status: string; offerNote: string; photos: string[]; plans: string[]; videoUrl: string; brochureUrl: string;
  description: string; amenities: string[]; units: PUnit[];
}) {
  const hero = photos[0] || null;
  const vid = videoUrl ? ytId(videoUrl) : null;
  const prices = units.map((u) => u.priceLakh).filter((x) => x > 0);
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const range = prices.length ? (lo === hi ? `₹${lo} L` : `₹${lo}–${hi} L`) : "—";
  const save = (u: PUnit) => (u.listPriceLakh > u.priceLakh ? u.listPriceLakh - u.priceLakh : 0);
  const bestId = units.reduce<{ i: number; s: number }>((acc, u, i) => (save(u) > acc.s ? { i, s: save(u) } : acc), { i: -1, s: 0 }).i;
  const left = units.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-[420px] h-full sm:h-auto sm:max-h-[90dvh] bg-white sm:rounded-3xl overflow-hidden flex flex-col shadow-hx-lg">
        {/* preview chrome */}
        <div className="h-12 shrink-0 border-b border-hx-line flex items-center px-4 gap-2 bg-white">
          <Eye className="w-4 h-4 text-hx-red" />
          <span className="text-[13px] font-semibold">Buyer preview</span>
          <span className="text-[11px] text-hx-muted">· how the page looks</span>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full hover:bg-hx-bg inline-flex items-center justify-center text-hx-slate"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto">
          {/* hero */}
          <div className="relative h-[180px]" style={hero ? undefined : { backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 16px,#FAEFE7 16px 32px)" }}>
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-hx-muted text-[11px] font-mono">[ add photos ]</div>
            )}
            <div className="absolute top-3 left-3 flex gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold"><BadgeCheck className="w-3 h-3" /> RERA verified</span>
            </div>
          </div>

          {/* gallery strip — every photo Pawan uploaded, as buyers swipe them */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3">
              {photos.slice(0, 8).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="w-20 h-16 rounded-lg object-cover border border-hx-line shrink-0" />
              ))}
            </div>
          )}

          <div className="px-4 pb-6">
            <div className="pt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[20px] font-bold tracking-tight">{name || "Project name"}</h1>
                <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-hx-slate"><MapPin className="w-3.5 h-3.5" /> {locality || "Locality"}, {city}</div>
                <div className="mt-0.5 text-[12px] text-hx-muted">{developer} · {bhk} · {facing}-facing</div>
              </div>
              <div className="num text-[20px] font-extrabold tracking-tight shrink-0">{range}</div>
            </div>

            {status !== "Live" && (
              <div className="mt-3 rounded-lg bg-hx-warning/10 border border-hx-warning/30 px-3 py-2 text-[12px] text-hx-ink">
                Status is <strong>{status}</strong> — buyers can only see this once it&apos;s set to <strong>Live</strong>.
              </div>
            )}

            {brochureUrl && (
              <a href={brochureUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white border border-hx-line text-[13px] font-semibold text-hx-ink">
                <FileText className="w-4 h-4 text-hx-red" /> Download brochure
              </a>
            )}

            {vid && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-hx-red mb-2"><Play className="w-3.5 h-3.5" /> Video tour</div>
                <div className="relative w-full rounded-2xl overflow-hidden border border-hx-line" style={{ aspectRatio: "16 / 9" }}>
                  <iframe src={`https://www.youtube.com/embed/${vid}`} title="tour" className="absolute inset-0 w-full h-full" allowFullScreen />
                </div>
              </div>
            )}

            {description && (
              <div className="mt-4">
                <div className="text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-1.5">Overview</div>
                <p className="text-[13.5px] text-hx-slate leading-relaxed whitespace-pre-wrap">{description}</p>
              </div>
            )}

            {/* pick your unit */}
            <div className="mt-5 flex items-center gap-2 mb-2">
              <span className="text-[12px] uppercase tracking-wider text-hx-muted font-medium">Pick your unit</span>
              {left > 0 && (
                <span className={`text-[10.5px] font-semibold rounded-full px-2 py-0.5 ${left <= 3 ? "bg-hx-red/10 text-hx-red" : "bg-hx-bg text-hx-slate"}`}>
                  {left <= 3 ? `Only ${left} left` : `${left} available`}
                </span>
              )}
            </div>

            {offerNote && (
              <div className="mb-2.5 rounded-xl bg-hx-red/[0.06] border border-hx-red/20 px-3.5 py-2.5 flex items-center gap-2 text-[12.5px] text-hx-ink">
                <Flame className="w-4 h-4 text-hx-red shrink-0" /> <span className="font-medium">{offerNote}</span>
              </div>
            )}

            {units.length === 0 && <div className="rounded-xl border border-hx-line p-4 text-[13px] text-hx-muted">Add a unit with a price to see it here.</div>}

            <div className="space-y-2.5">
              {units.map((u, i) => {
                const sv = save(u);
                const best = i === bestId && sv > 0;
                return (
                  <div key={i} className={`rounded-2xl border bg-white p-3.5 ${best ? "border-hx-red/40" : "border-hx-line"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {best && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hx-red text-white text-[9.5px] font-bold uppercase tracking-wide"><Flame className="w-2.5 h-2.5" /> Best deal</span>}
                          <span className="text-[14px] font-bold">Floor {u.floor}</span>
                          <span className="text-[12px] text-hx-muted">· {u.facing}-facing · {u.carpetSqft} sqft</span>
                        </div>
                        {u.tag && <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-hx-bg border border-hx-line text-[11px] text-hx-slate"><Tag className="w-3 h-3" /> {u.tag}</span>}
                      </div>
                      <div className="text-right shrink-0">
                        {sv > 0 && <div className="num text-[12px] text-hx-muted line-through">₹{u.listPriceLakh} L</div>}
                        <div className="num text-[19px] font-extrabold tracking-tight leading-tight">₹{u.priceLakh} L</div>
                        {sv > 0 && <div className="num text-[11px] font-bold text-hx-success">Save ₹{sv} L</div>}
                      </div>
                    </div>
                    <div className="mt-3 w-full h-10 rounded-xl bg-hx-red text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 opacity-90">
                      <Lock className="w-4 h-4" /> {sv > 0 ? `Lock this price · save ₹${sv} L` : "Lock this price"}
                    </div>
                  </div>
                );
              })}
            </div>

            {plans.length > 0 && (
              <>
                <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Floor plans</div>
                <div className="grid grid-cols-2 gap-3">
                  {plans.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`Floor plan ${i + 1}`} className="w-full h-40 object-contain rounded-xl border border-hx-line bg-hx-bg" />
                  ))}
                </div>
              </>
            )}

            {amenities.length > 0 && (
              <>
                <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hx-bg border border-hx-line text-[12.5px] text-hx-slate"><Check className="w-3.5 h-3.5 text-hx-success" /> {a}</span>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5 rounded-xl border border-hx-line p-3 text-[11.5px] text-hx-muted leading-relaxed">
              This is a preview built from what you&apos;ve typed{reraId ? ` · RERA ${reraId}` : ""}. Nothing is saved until you tap <strong className="text-hx-ink">Save</strong>.
            </div>
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
function UField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-hx-muted mb-1 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} inputMode={type === "number" ? "numeric" : undefined}
        className={`w-full h-9 px-2 rounded-lg border border-hx-line bg-white text-[13px] outline-none focus:border-hx-red/50 ${type === "number" ? "num" : ""}`} />
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
// Grid of uploaded media — tap to enlarge, remove, and (for photos) set the cover.
function MediaGrid({
  srcs, onRemove, onView, onMakeCover, showCover,
}: {
  srcs: string[]; onRemove: (i: number) => void; onView: (src: string) => void;
  onMakeCover?: (i: number) => void; showCover?: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2.5">
      {srcs.map((src, i) => (
        <div key={i} className="relative w-[96px] h-[74px] rounded-lg overflow-hidden border border-hx-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="w-full h-full object-cover cursor-zoom-in" onClick={() => onView(src)} />
          <button type="button" onClick={() => onView(src)} aria-label="Enlarge"
            className="absolute bottom-1 left-1 w-5 h-5 rounded-md bg-black/55 text-white inline-flex items-center justify-center">
            <ZoomIn className="w-3 h-3" />
          </button>
          {showCover && (i === 0 ? (
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-hx-red text-white text-[9px] font-bold uppercase tracking-wide inline-flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-white" /> Cover</span>
          ) : onMakeCover ? (
            <button type="button" onClick={() => onMakeCover(i)} title="Make cover"
              className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/55 text-white inline-flex items-center justify-center">
              <Star className="w-3 h-3" />
            </button>
          ) : null)}
          <button type="button" onClick={() => onRemove(i)} aria-label="Remove"
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/55 text-white inline-flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
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
