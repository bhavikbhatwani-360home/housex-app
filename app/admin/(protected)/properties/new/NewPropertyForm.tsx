"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Sparkles, Briefcase, Camera, Loader2, AlertCircle, CheckCircle2, X, Search } from "lucide-react";

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

  // ── AI brochure auto-fill ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<{ confidence: string; notes: string } | null>(null);
  // Photos pulled from the brochure (data URLs), kept separate from the manual
  // URL fields and merged on save.
  const [photos, setPhotos] = useState<string[]>([]);
  const [plans, setPlans] = useState<string[]>([]);

  // Resize an image client-side to keep stored photos light (~1600px JPEG).
  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });

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

  const autofill = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAiError("");
    setAiResult(null);
    setAiBusy(true);
    try {
      const fileArr = Array.from(files).slice(0, 8);
      const pdfFile = fileArr.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));

      // A PDF goes to Claude as a document (it reads every page); photos go as
      // images (and get classified for the gallery).
      let images: string[] = [];
      let payload: { pdf?: string; images?: string[] };
      if (pdfFile) {
        const pdf = await readAsDataUrl(pdfFile);
        payload = { pdf };
      } else {
        images = await Promise.all(fileArr.map((f) => resizeImage(f)));
        payload = { images };
      }

      const res = await fetch("/api/admin/extract-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Couldn't read the brochure.");
        return;
      }
      applyExtraction(data, images);
    } catch {
      setAiError("Something went wrong reading the photos. Try again or fill the form manually.");
    } finally {
      setAiBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Fill the form from an extraction response. `localImages` are the resized
  // data URLs we uploaded (so we can attach the ones the AI marked as photos);
  // empty for PDF/URL extractions.
  const applyExtraction = (data: { listing: Record<string, unknown> }, localImages: string[]) => {
    const l = data.listing as {
      name?: string; developer?: string; city?: string; locality?: string; bhk?: string; facing?: string;
      carpetSqft?: number; distanceToStationM?: number; reraId?: string; possession?: string; description?: string;
      amenities?: string[]; nearby?: string[]; totalTowers?: number; totalUnits?: number; projectArea?: string; totalFloors?: string;
      units?: { floor?: number; priceLakh?: number; facing?: string; carpetSqft?: number }[];
      imageKinds?: { index: number; kind: string }[]; confidence?: string; notes?: string;
    };
    const kinds: Record<number, string> = {};
    if (Array.isArray(l.imageKinds)) for (const k of l.imageKinds) kinds[k.index] = k.kind;
    const gallery: string[] = [];
    const floorPlans: string[] = [];
    localImages.forEach((src, i) => {
      const kind = kinds[i];
      if (kind === "floor_plan") floorPlans.push(src);
      else if (kind === "cost_sheet") return; // data only — don't show buyers
      else gallery.push(src);
    });
    if (gallery.length) setPhotos((p) => [...p, ...gallery]);
    if (floorPlans.length) setPlans((p) => [...p, ...floorPlans]);
    const okBhk = BHKS.includes(l.bhk || "") ? (l.bhk as string) : f.bhk;
    const okFacing = FACINGS.includes(l.facing || "") ? (l.facing as string) : f.facing;
    setF((p) => ({
      ...p,
      name: l.name || p.name,
      developer: developerId ? p.developer : l.developer || p.developer,
      city: l.city || p.city,
      locality: l.locality || p.locality,
      bhk: okBhk,
      facing: okFacing,
      carpetSqft: l.carpetSqft ? String(l.carpetSqft) : p.carpetSqft,
      distanceToStationM: l.distanceToStationM ? String(l.distanceToStationM) : p.distanceToStationM,
      reraId: l.reraId || p.reraId,
      possession: l.possession || p.possession,
      description: l.description || p.description,
      amenities: Array.isArray(l.amenities) && l.amenities.length ? l.amenities.join(", ") : p.amenities,
      nearby: Array.isArray(l.nearby) && l.nearby.length ? l.nearby.join("\n") : p.nearby,
      totalTowers: l.totalTowers ? String(l.totalTowers) : p.totalTowers,
      totalUnits: l.totalUnits ? String(l.totalUnits) : p.totalUnits,
      projectArea: l.projectArea || p.projectArea,
      totalFloors: l.totalFloors || p.totalFloors,
      status: "Pending",
    }));
    if (Array.isArray(l.units) && l.units.length) {
      setUnits(
        l.units.map((u) => ({
          floor: u.floor ? String(u.floor) : "",
          priceLakh: u.priceLakh ? String(u.priceLakh) : "",
          facing: FACINGS.includes(u.facing || "") ? (u.facing as string) : okFacing,
          carpetSqft: u.carpetSqft ? String(u.carpetSqft) : "",
        }))
      );
    }
    setAiResult({ confidence: l.confidence || "medium", notes: l.notes || "" });
  };

  // ── Find brochure & photos on the web ──
  const [findBusy, setFindBusy] = useState(false);
  const [findError, setFindError] = useState("");
  const [findResult, setFindResult] = useState<{ projectUrl: string; brochureUrl: string; imageUrls: string[]; summary: string; confidence: string } | null>(null);

  const findOnline = async () => {
    setFindError("");
    setFindResult(null);
    setFindBusy(true);
    try {
      const res = await fetch("/api/admin/find-brochure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.name, developer: developerId ? devLabel : f.developer, locality: f.locality, city: f.city }),
      });
      const data = await res.json();
      if (res.ok) setFindResult(data.result);
      else setFindError(data.error || "Web search failed.");
    } catch {
      setFindError("Web search failed — try again or upload the brochure manually.");
    } finally {
      setFindBusy(false);
    }
  };

  // Read a found brochure link (server fetches the PDF) and fill the form.
  const readBrochureUrl = async (url: string) => {
    setAiError("");
    setAiResult(null);
    setAiBusy(true);
    try {
      const res = await fetch("/api/admin/extract-listing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pdfUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Couldn't read that brochure."); return; }
      applyExtraction(data, []);
    } catch {
      setAiError("Couldn't read that brochure — open the link and upload the file instead.");
    } finally {
      setAiBusy(false);
    }
  };

  const addFoundPhotos = (urls: string[]) => setPhotos((p) => [...p, ...urls.filter((u) => !p.includes(u))]);

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
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6 gap-3 sticky top-0 z-10">
        <Link href="/admin/properties" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-[16px] font-semibold tracking-tight">{isEdit ? "Edit property" : "Add property"}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button form="adminpropform" disabled={busy} className="h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-40">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Publish"}
          </button>
          {isEdit && nextPendingId && (
            <button type="button" onClick={() => save(true)} disabled={busy} className="h-9 px-4 rounded-lg bg-hx-ink text-white text-[13px] font-semibold disabled:opacity-40 inline-flex items-center gap-1.5">
              Save &amp; next →
            </button>
          )}
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-5xl">
        <form id="adminpropform" onSubmit={submit} className="space-y-5">
          {/* ── AI brochure auto-fill ── */}
          <div className="rounded-xl border border-hx-red/30 bg-hx-red/[0.03] p-5">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-hx-red/10 text-hx-red inline-flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">Auto-fill from brochure</div>
                <p className="text-[12px] text-hx-muted mt-0.5 leading-relaxed">
                  Drop the brochure PDF (or photos of it). HouseX AI reads every page and fills the form below — then you review &amp; edit (especially price) before publishing.
                </p>
                <div className="mt-3 flex items-center gap-2.5 flex-wrap">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => autofill(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={aiBusy}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red disabled:opacity-50"
                  >
                    {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {aiBusy ? "Reading brochure…" : "Upload brochure PDF or photos"}
                  </button>
                  <span className="text-[11px] text-hx-muted">PDF, or JPG/PNG photos (up to 8)</span>
                  <span className="text-[11px] text-hx-muted">or</span>
                  <button
                    type="button"
                    onClick={findOnline}
                    disabled={findBusy || !f.name.trim()}
                    title={!f.name.trim() ? "Add the project name first" : ""}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-hx-line text-hx-slate text-[13px] font-semibold hover:bg-hx-bg disabled:opacity-50"
                  >
                    {findBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {findBusy ? "Searching the web…" : "Find online"}
                  </button>
                </div>

                {findError && (
                  <div className="mt-3 flex items-start gap-2 text-[12.5px] text-hx-danger">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {findError}
                  </div>
                )}
                {findResult && (
                  <div className="mt-3 rounded-lg border border-hx-line bg-white p-3">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <Search className="w-4 h-4 text-hx-red" /> Found online
                      <span className={`ml-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${findResult.confidence === "high" ? "bg-hx-success/10 text-hx-success" : findResult.confidence === "low" ? "bg-hx-danger/10 text-hx-danger" : "bg-hx-warning/10 text-hx-warning"}`}>
                        {findResult.confidence} confidence
                      </span>
                    </div>
                    {findResult.summary && <p className="mt-1.5 text-[12px] text-hx-slate leading-relaxed">{findResult.summary}</p>}
                    <p className="mt-1.5 text-[11px] text-hx-warning">Double-check this is the right project before using it.</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {findResult.projectUrl && (
                        <a href={findResult.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-hx-red hover:underline">
                          Open project page ↗
                        </a>
                      )}
                      {findResult.brochureUrl && (
                        <>
                          <a href={findResult.brochureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-hx-red hover:underline">
                            Open brochure PDF ↗
                          </a>
                          <button type="button" onClick={() => readBrochureUrl(findResult.brochureUrl)} disabled={aiBusy} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-hx-ink text-white text-[12px] font-semibold disabled:opacity-50">
                            {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Read this brochure
                          </button>
                        </>
                      )}
                    </div>

                    {findResult.imageUrls.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] font-medium text-hx-slate mb-1.5">Photos found — add the good ones:</div>
                        <div className="flex flex-wrap gap-2">
                          {findResult.imageUrls.map((src, i) => (
                            <div key={i} className="relative w-[88px] h-[66px] rounded-lg overflow-hidden border border-hx-line">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => addFoundPhotos(findResult.imageUrls)} className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-hx-line text-hx-slate text-[12px] font-semibold hover:bg-hx-bg">
                          <Plus className="w-3.5 h-3.5" /> Add these {findResult.imageUrls.length} photos
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {aiError && (
                  <div className="mt-3 flex items-start gap-2 text-[12.5px] text-hx-danger">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {aiError}
                  </div>
                )}
                {aiResult && (
                  <div className="mt-3 rounded-lg border border-hx-line bg-white p-3">
                    <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-hx-success">
                      <CheckCircle2 className="w-4 h-4" /> Draft filled below — please review
                      <span className={`ml-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${aiResult.confidence === "high" ? "bg-hx-success/10 text-hx-success" : aiResult.confidence === "low" ? "bg-hx-danger/10 text-hx-danger" : "bg-hx-warning/10 text-hx-warning"}`}>
                        {aiResult.confidence} confidence
                      </span>
                    </div>
                    {aiResult.notes && <p className="mt-1.5 text-[12px] text-hx-slate leading-relaxed">⚠️ {aiResult.notes}</p>}
                    <p className="mt-1.5 text-[11.5px] text-hx-muted">Status set to <strong>Pending</strong> — verify the price &amp; offers, then set Status to <strong>Live</strong> to approve.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

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

            {photos.length > 0 && (
              <ThumbStrip label={`Photos from brochure (${photos.length})`} srcs={photos} onRemove={(i) => setPhotos((p) => p.filter((_, j) => j !== i))} />
            )}
            {plans.length > 0 && (
              <ThumbStrip label={`Floor plans from brochure (${plans.length})`} srcs={plans} onRemove={(i) => setPlans((p) => p.filter((_, j) => j !== i))} />
            )}

            <Textarea label="More photo URLs — one per line (optional)" value={f.images} onChange={(v) => setF((p) => ({ ...p, images: v }))} rows={2} placeholder="https://…/photo1.jpg" />
            <Textarea label="More floor plan URLs — one per line (optional)" value={f.floorPlans} onChange={(v) => setF((p) => ({ ...p, floorPlans: v }))} rows={2} placeholder="https://…/2bhk-floorplan.jpg" />
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
        <div className="lg:sticky lg:top-20 h-fit">
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
    <div className="rounded-xl border border-hx-line bg-white p-5">
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
