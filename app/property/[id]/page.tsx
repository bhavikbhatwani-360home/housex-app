import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, MapPin, Sparkles, Check, Building2, Compass, Train,
  Layers, Play, KeyRound, Briefcase, ExternalLink,
  FileText, GraduationCap, Stethoscope, ShoppingBag, TrainFront, Plane, Utensils, Landmark, Trees,
} from "lucide-react";
import { prisma } from "@/lib/db";
import ShareButton from "./ShareButton";
import PropertyActions from "./PropertyActions";
import EmiCalculator from "./EmiCalculator";
import UnitsBlock from "./UnitsBlock";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await prisma.property.findUnique({
      where: { id },
      select: { name: true, developer: true, locality: true, city: true, priceMin: true, priceMax: true, bhk: true, images: true, description: true },
    });
    if (!p) return { title: "Property — HouseX" };
    const range = p.priceMin === p.priceMax ? `₹${p.priceMin} L` : `₹${p.priceMin}–${p.priceMax} L`;
    const title = `${p.name} — ${range} · ${p.bhk} in ${p.locality}`;
    const description = p.description || `${p.bhk} by ${p.developer} in ${p.locality}, ${p.city}. RERA-verified on HouseX.`;
    return {
      title,
      description,
      openGraph: { title, description, type: "website", images: p.images.length ? [p.images[0]] : undefined },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Property — HouseX" };
  }
}

function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const BANDS = [
  { label: "1–4", lo: 1, hi: 4 },
  { label: "5–11", lo: 5, hi: 11 },
  { label: "12–15", lo: 12, hi: 15 },
  { label: "15+", lo: 16, hi: 9999 },
];

function nearbyIcon(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("school") || c.includes("college")) return GraduationCap;
  if (c.includes("hospital") || c.includes("clinic")) return Stethoscope;
  if (c.includes("market") || c.includes("mall") || c.includes("shop")) return ShoppingBag;
  if (c.includes("metro") || c.includes("station") || c.includes("train") || c.includes("railway")) return TrainFront;
  if (c.includes("airport")) return Plane;
  if (c.includes("restaurant") || c.includes("food") || c.includes("cafe")) return Utensils;
  if (c.includes("bank") || c.includes("atm")) return Landmark;
  if (c.includes("park") || c.includes("garden")) return Trees;
  return MapPin;
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let p;
  try {
    p = await prisma.property.findUnique({
      where: { id },
      include: { units: { where: { available: true }, orderBy: { floor: "asc" } } },
    });
  } catch {
    p = null;
  }
  // Only approved (Live) listings are publicly viewable — a Draft/Pending
  // listing 404s even on a direct link until a manager approves it.
  if (!p || p.status !== "Live") notFound();

  const range = p.priceMin === p.priceMax ? `₹${p.priceMin} L` : `₹${p.priceMin}–${p.priceMax} L`;
  const perSqft = p.carpetSqft > 0 ? Math.round((p.priceMin * 100000) / p.carpetSqft).toLocaleString("en-IN") : null;
  const vid = youtubeId(p.videoUrl);
  const hero = p.images[0] || null;

  const basics = [
    p.totalTowers ? `${p.totalTowers} towers` : null,
    p.totalUnits ? `${p.totalUnits} units` : null,
    p.projectArea || null,
    p.totalFloors || null,
  ].filter(Boolean) as string[];

  // floor × view price matrix
  const usedBands = BANDS.filter((b) => p.units.some((u) => u.floor >= b.lo && u.floor <= b.hi));
  const facings = Array.from(new Set(p.units.map((u) => u.facing)));
  const cell = (facing: string, b: (typeof BANDS)[number]) => {
    const us = p.units.filter((u) => u.facing === facing && u.floor >= b.lo && u.floor <= b.hi).map((u) => u.priceLakh);
    if (us.length === 0) return null;
    const lo = Math.min(...us), hi = Math.max(...us);
    return lo === hi ? `₹${lo}L` : `₹${lo}–${hi}L`;
  };
  const showMatrix = usedBands.length > 0 && facings.length > 0;

  const nearby = p.nearby.map((line) => {
    const parts = line.split(",").map((s) => s.trim());
    return { category: parts[0] || "", name: parts[1] || parts[0] || "", distance: parts[2] || "" };
  });

  // a readable "why this home" line built from the listing's own facts
  const whyBits = [
    `RERA-verified${p.bhk ? ` ${p.bhk}` : ""}`,
    p.facing ? `${p.facing}-facing` : null,
    p.distanceToStationM > 0 ? `just ${p.distanceToStationM} m from the station` : null,
    p.possession ? `possession ${p.possession}` : null,
  ].filter(Boolean);
  const whyLine =
    whyBits.join(", ") +
    (p.amenities.length ? `, with ${p.amenities.slice(0, 2).join(" & ").toLowerCase()}` : "") +
    ".";

  const facts = [
    { icon: Building2, label: "Configuration", value: p.bhk },
    { icon: Compass, label: "Facing", value: p.facing },
    { icon: Layers, label: "Carpet area", value: `${p.carpetSqft} sqft` },
    { icon: Train, label: "From station", value: `${p.distanceToStationM} m` },
    { icon: KeyRound, label: "Possession", value: p.possession || "Contact developer" },
    { icon: BadgeCheck, label: "RERA", value: p.reraId || "Registered" },
  ];

  return (
    <div className="min-h-dvh bg-white text-hx-ink pb-[88px]">
      <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur border-b border-hx-line flex items-center px-4 gap-3">
        <Link href="/chat" className="w-9 h-9 rounded-full border border-hx-line inline-flex items-center justify-center text-hx-slate hover:bg-hx-bg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold tracking-tight truncate">{p.name}</div>
          <div className="text-[11px] text-hx-muted truncate">{p.developer}</div>
        </div>
        <span className="num text-[15px] font-extrabold tracking-tight shrink-0">{range}</span>
        <ShareButton title={`${p.name} — ${range} · ${p.bhk} in ${p.locality} · HouseX`} />
      </header>

      <div className="max-w-2xl mx-auto">
        {/* hero */}
        <div className="relative h-[210px] sm:h-[260px]" style={hero ? undefined : { backgroundImage: "repeating-linear-gradient(135deg,#F1E2D8 0 16px,#FAEFE7 16px 32px)" }}>
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-hx-muted text-[11px] font-mono">[ {p.name} · add photos ]</div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-red text-white text-[11px] font-semibold"><BadgeCheck className="w-3 h-3" /> RERA verified</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-hx-ink text-[11px] font-semibold">{p.status}</span>
          </div>
        </div>
        {p.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pt-3">
            {p.images.slice(0, 8).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" className="w-20 h-16 rounded-lg object-cover border border-hx-line shrink-0" />
            ))}
          </div>
        )}

        <div className="px-5">
          {/* title + price */}
          <div className="pt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold tracking-tight">{p.name}</h1>
              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-hx-slate"><MapPin className="w-3.5 h-3.5" /> {p.locality}, {p.city}</div>
              {basics.length > 0 && <div className="mt-1.5 text-[12px] text-hx-muted">{basics.join(" · ")}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="num text-[22px] font-extrabold tracking-tight">{range}</div>
              {perSqft && <div className="num text-[11px] text-hx-muted">₹{perSqft}/sqft</div>}
            </div>
          </div>

          {/* brochure */}
          {p.brochureUrl && (
            <a href={p.brochureUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white border border-hx-line text-[13px] font-semibold text-hx-ink hover:bg-hx-bg">
              <FileText className="w-4 h-4 text-hx-red" /> Download brochure
            </a>
          )}

          {/* VIDEO TOUR */}
          {vid && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-hx-red mb-2"><Play className="w-3.5 h-3.5" /> Video tour</div>
              <div className="relative w-full rounded-2xl overflow-hidden border border-hx-line" style={{ aspectRatio: "16 / 9" }}>
                <iframe src={`https://www.youtube.com/embed/${vid}`} title={`${p.name} tour`} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          )}

          {/* overview */}
          {p.description && (
            <div className="mt-5">
              <div className="text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-1.5">Overview</div>
              <p className="text-[14px] text-hx-slate leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </div>
          )}

          {/* why it fits */}
          <div className="mt-5 rounded-2xl border border-hx-line bg-hx-bg/60 p-4">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-hx-red mb-2"><Sparkles className="w-3.5 h-3.5" /> Why this home</div>
            <p className="text-[13.5px] text-hx-ink leading-relaxed">{whyLine}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[`RERA-verified`, `${p.distanceToStationM} m from station`, `${p.facing}-facing`, ...p.amenities.slice(0, 4)].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-hx-line text-[12px] font-medium text-hx-slate"><Check className="w-3 h-3 text-hx-success" /> {chip}</span>
              ))}
            </div>
          </div>

          {/* affordability — interactive EMI */}
          <EmiCalculator priceLakh={p.priceMin} />

          {/* key facts */}
          <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Key facts</div>
          <div className="grid grid-cols-2 gap-2.5">
            {facts.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="rounded-xl border border-hx-line p-3">
                  <span className="w-8 h-8 rounded-lg bg-hx-bg text-hx-slate inline-flex items-center justify-center"><Icon className="w-4 h-4" /></span>
                  <div className="text-[10.5px] uppercase tracking-wider text-hx-muted mt-2">{f.label}</div>
                  <div className="text-[13.5px] font-semibold truncate">{f.value}</div>
                </div>
              );
            })}
          </div>

          {/* PRICE BY FLOOR & VIEW */}
          {showMatrix && (
            <>
              <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Price by floor &amp; view</div>
              <div className="rounded-xl border border-hx-line overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[360px]">
                  <thead>
                    <tr className="border-b border-hx-line text-[11px] text-hx-muted">
                      <th className="px-3 py-2.5 font-medium">View ↓ / Floor →</th>
                      {usedBands.map((b) => <th key={b.label} className="px-3 py-2.5 font-medium num text-center">{b.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {facings.map((fc) => (
                      <tr key={fc} className="border-b border-hx-line last:border-0">
                        <td className="px-3 py-2.5 text-[12.5px] font-medium">{fc}</td>
                        {usedBands.map((b) => {
                          const v = cell(fc, b);
                          return <td key={b.label} className={`px-3 py-2.5 num text-[12.5px] text-center ${v ? "font-semibold" : "text-hx-muted"}`}>{v || "—"}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* pick your unit — anchored offer pricing + lock-the-price */}
          <UnitsBlock
            propertyId={p.id}
            propertyName={p.name}
            offerNote={p.offerNote}
            units={p.units.map((u) => ({
              id: u.id,
              floor: u.floor,
              facing: u.facing,
              carpetSqft: u.carpetSqft,
              priceLakh: u.priceLakh,
              listPriceLakh: u.listPriceLakh,
              tag: u.tag,
            }))}
          />

          {/* floor plans */}
          {p.floorPlans.length > 0 && (
            <>
              <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Floor plans</div>
              <div className="grid grid-cols-2 gap-3">
                {p.floorPlans.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-hx-line overflow-hidden bg-hx-bg">
                    <img src={src} alt={`Floor plan ${i + 1}`} className="w-full h-40 object-contain" />
                  </a>
                ))}
              </div>
            </>
          )}

          {/* amenities */}
          {p.amenities.length > 0 && (
            <>
              <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hx-bg border border-hx-line text-[12.5px] text-hx-slate"><Check className="w-3.5 h-3.5 text-hx-success" /> {a}</span>
                ))}
              </div>
            </>
          )}

          {/* what's nearby */}
          {nearby.length > 0 && (
            <>
              <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">What&apos;s nearby</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nearby.map((nb, i) => {
                  const Icon = nearbyIcon(nb.category);
                  return (
                    <div key={i} className="rounded-xl border border-hx-line p-3 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{nb.name}</div>
                        <div className="text-[11px] text-hx-muted capitalize">{nb.category}</div>
                      </div>
                      {nb.distance && <span className="num text-[12px] font-semibold text-hx-slate shrink-0">{nb.distance}</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* trust + RERA verify */}
          <div className="mt-6 rounded-2xl border border-hx-line p-4 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center shrink-0"><BadgeCheck className="w-5 h-5" /></span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold">RERA verified · {p.reraId || "registered"}</div>
              <div className="text-[12px] text-hx-muted mt-0.5">By {p.developer}. Every HouseX listing is checked — no fake listings, no brokers.</div>
              {p.reraId && (
                <a href="https://maharera.maharashtra.gov.in/registered-projects" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-hx-red hover:underline">
                  Verify on MahaRERA <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* on the map */}
          <div className="mt-6 text-[12px] uppercase tracking-wider text-hx-muted font-medium mb-2">On the map</div>
          <div className="rounded-2xl border border-hx-line overflow-hidden">
            <iframe
              title={`${p.name} location`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${p.name}, ${p.locality}, ${p.city}`)}&z=14&output=embed`}
              className="w-full h-[220px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* developer claim — only on unclaimed (seeded) listings */}
          {!p.developerId && (
            <Link href={`/claim/${p.id}`} className="mt-3 rounded-2xl border border-hx-line bg-hx-bg/60 p-4 flex items-center gap-3 hover:border-hx-red/40 transition-colors">
              <span className="w-9 h-9 rounded-xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><Briefcase className="w-4.5 h-4.5" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">Are you the developer of {p.name}?</div>
                <div className="text-[12px] text-hx-muted">Claim this listing free — get every lead routed to you.</div>
              </div>
              <span className="text-[13px] font-semibold text-hx-red shrink-0">Claim →</span>
            </Link>
          )}
        </div>
      </div>

      {/* sticky actions — book a visit / request offer directly on this listing */}
      <PropertyActions propertyId={p.id} propertyName={p.name} locality={p.locality} priceMin={p.priceMin} />
    </div>
  );
}
