"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Our fields and the keywords we use to auto-guess the CSV column.
const TARGETS: { key: string; label: string; required?: boolean; hints: string[] }[] = [
  { key: "name", label: "Project name", required: true, hints: ["project name", "projectname", "project", "name of project", "name"] },
  { key: "developer", label: "Developer / promoter", hints: ["promoter", "developer", "builder", "company"] },
  { key: "reraId", label: "RERA number", hints: ["primary rera", "registration", "rera no", "rera", "certificate", "reg no", "regno"] },
  { key: "locality", label: "Locality / area", hints: ["location", "taluka", "village", "locality", "area", "tehsil"] },
  { key: "city", label: "City / district", hints: ["district", "city"] },
  { key: "possession", label: "Possession", hints: ["target possession", "completion", "possession", "end date", "proposed date"] },
  { key: "priceMin", label: "Price (min)", hints: ["price (min)", "price min", "min price", "starting price", "price from"] },
  { key: "priceMax", label: "Price (max)", hints: ["price (max)", "price max", "max price", "price to"] },
  { key: "bhk", label: "BHK configuration", hints: ["bhk", "configuration", "config", "unit type"] },
  { key: "carpetSqft", label: "Carpet area", hints: ["carpet", "area (sqft)", "sqft", "size"] },
  { key: "towers", label: "Towers", hints: ["towers", "tower", "buildings", "wings"] },
  { key: "floors", label: "Floors", hints: ["floors", "floor", "storeys"] },
];

// Minimal but quote-aware CSV parser (handles "a,b", escaped "" and CRLF).
function parseCsv(raw: string): { headers: string[]; rows: string[][] } {
  const text = raw.replace(/^﻿/, ""); // strip UTF-8 BOM (common in exports)
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); out.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\n") pushRow();
    else if (c === "\r") { /* skip, CRLF handled by \n */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) pushRow();
  const all = out.filter((r) => r.some((c) => c.trim() !== ""));
  if (all.length === 0) return { headers: [], rows: [] };
  return { headers: all[0].map((h) => h.trim()), rows: all.slice(1) };
}

function guessColumn(headers: string[], hints: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const hint of hints) {
    const i = lower.findIndex((h) => h === hint);
    if (i >= 0) return i;
  }
  for (const hint of hints) {
    const i = lower.findIndex((h) => h.includes(hint));
    if (i >= 0) return i;
  }
  return -1;
}

export default function ImportTool() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number; withPrice: number } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setResult(null);
    const text = await file.text();
    const { headers: h, rows: r } = parseCsv(text);
    if (h.length === 0) { setError("That file looks empty or isn't a CSV."); return; }
    setFileName(file.name);
    setHeaders(h);
    setRows(r);
    const guess: Record<string, number> = {};
    for (const t of TARGETS) guess[t.key] = guessColumn(h, t.hints);
    setMap(guess);
  };

  const mapped = useMemo(() => {
    if (rows.length === 0) return [];
    return rows.map((r) => {
      const o: Record<string, string> = {};
      for (const t of TARGETS) {
        const i = map[t.key];
        o[t.key] = i >= 0 && i < r.length ? (r[i] || "").trim() : "";
      }
      return o;
    }).filter((o) => o.name);
  }, [rows, map]);

  const nameMapped = (map.name ?? -1) >= 0;

  const doImport = async () => {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/properties/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: mapped }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ created: data.created, skipped: data.skipped, withPrice: data.withPrice ?? 0 });
        router.refresh();
      } else setError(data.error || "Import failed.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6 gap-3 sticky top-0 z-10">
        <Link href="/admin/properties" className="w-8 h-8 rounded-lg border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-[16px] font-semibold tracking-tight">Import projects from RERA</h1>
      </header>

      <div className="p-6 max-w-3xl space-y-5">
        <div className="rounded-xl border border-hx-line bg-white p-5">
          <div className="text-[13px] font-semibold mb-1.5">1 · Upload the area&apos;s RERA CSV</div>
          <p className="text-[12.5px] text-hx-muted leading-relaxed mb-3">
            Pull the projects for one area from MahaRERA (filter by district/taluka — e.g. Palghar / Vasai for Virar–Vasai–Nalasopara) and save as CSV. Each project becomes a <strong>Pending</strong> skeleton your team enriches with brochures.
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-hx-red text-white text-[13px] font-semibold shadow-hx-red">
            <Upload className="w-4 h-4" /> Choose CSV file
          </button>
          {fileName && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-[12.5px] text-hx-slate">
              <FileSpreadsheet className="w-4 h-4 text-hx-success" /> {fileName} · {rows.length} rows
            </span>
          )}
        </div>

        {headers.length > 0 && (
          <div className="rounded-xl border border-hx-line bg-white p-5">
            <div className="text-[13px] font-semibold mb-1.5">2 · Match the columns</div>
            <p className="text-[12.5px] text-hx-muted mb-3">We guessed these from your file — fix any that are wrong.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TARGETS.map((t) => (
                <label key={t.key} className="block">
                  <span className="text-[12px] font-medium text-hx-slate mb-1 block">
                    {t.label} {t.required && <span className="text-hx-red">*</span>}
                  </span>
                  <select
                    value={map[t.key] ?? -1}
                    onChange={(e) => setMap((m) => ({ ...m, [t.key]: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-lg border border-hx-line bg-hx-bg text-[13.5px] outline-none focus:border-hx-red/50"
                  >
                    <option value={-1}>— none —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}

        {headers.length > 0 && nameMapped && (
          <div className="rounded-xl border border-hx-line bg-white p-5">
            <div className="text-[13px] font-semibold mb-3">3 · Preview &amp; import <span className="text-hx-muted font-normal">· {mapped.length} projects</span></div>
            <div className="overflow-x-auto rounded-lg border border-hx-line">
              <table className="w-full text-[12px]">
                <thead className="bg-hx-bg text-hx-muted">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Project</th>
                    <th className="text-left font-medium px-3 py-2">Developer</th>
                    <th className="text-left font-medium px-3 py-2">Locality</th>
                    <th className="text-left font-medium px-3 py-2">Price</th>
                    <th className="text-left font-medium px-3 py-2">BHK</th>
                    <th className="text-left font-medium px-3 py-2">RERA</th>
                  </tr>
                </thead>
                <tbody>
                  {mapped.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-hx-line">
                      <td className="px-3 py-2 font-medium">{r.name}</td>
                      <td className="px-3 py-2 text-hx-slate">{r.developer || "—"}</td>
                      <td className="px-3 py-2 text-hx-slate">{r.locality || "—"}</td>
                      <td className="px-3 py-2 text-hx-slate">{r.priceMin || r.priceMax ? `${r.priceMin || "?"}–${r.priceMax || "?"}` : "—"}</td>
                      <td className="px-3 py-2 text-hx-slate">{r.bhk || "—"}</td>
                      <td className="px-3 py-2 num text-hx-muted">{r.reraId || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {mapped.length > 5 && <p className="text-[11.5px] text-hx-muted mt-2">…and {mapped.length - 5} more.</p>}

            <button onClick={doImport} disabled={busy || mapped.length === 0} className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-hx-red text-white text-[13.5px] font-semibold shadow-hx-red disabled:opacity-40">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {busy ? "Importing…" : `Import ${mapped.length} projects`}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-hx-danger/30 bg-hx-danger/5 p-3 flex items-start gap-2 text-[13px] text-hx-danger">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}
        {result && (
          <div className="rounded-lg border border-hx-success/30 bg-hx-success/5 p-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-hx-success">
              <CheckCircle2 className="w-4.5 h-4.5" /> Imported {result.created} projects
            </div>
            <p className="text-[12.5px] text-hx-slate mt-1">
              {result.withPrice > 0 && `${result.withPrice} came in with a price. `}
              {result.skipped > 0 && `${result.skipped} skipped (already in the system). `}
              All are <strong>Pending</strong> — verify the price (and add brochure details), then approve to go Live.
            </p>
            <Link href="/admin/properties" className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-hx-ink text-white text-[13px] font-semibold">
              Go to properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
