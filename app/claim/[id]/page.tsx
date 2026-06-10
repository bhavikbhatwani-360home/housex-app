import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, BadgeCheck, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import ClaimForm from "./ClaimForm";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.property
    .findUnique({ where: { id }, select: { id: true, name: true, developer: true, locality: true, city: true, reraId: true, developerId: true, status: true } })
    .catch(() => null);

  if (!p) notFound();

  const claimed = Boolean(p.developerId);

  return (
    <div className="min-h-dvh bg-hx-bg">
      <nav className="px-5 py-3.5 border-b border-hx-line bg-white">
        <Link href="/" aria-label="HouseX" className="inline-flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/housex-logo.png" alt="HouseX" className="h-8 w-auto" />
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-5 py-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium text-hx-red" style={{ background: "rgba(224,57,67,0.08)" }}>
          <Users className="w-3.5 h-3.5" /> For developers
        </span>
        <h1 className="mt-4 text-[26px] sm:text-[30px] font-semibold tracking-tight leading-tight">
          Is this your project? <span className="text-hx-red">Claim it free.</span>
        </h1>
        <p className="mt-2 text-[14px] text-hx-muted leading-relaxed">
          Buyers are already discovering <strong className="text-hx-ink">{p.name}</strong> on HouseX. Claim the listing and every enquiry, site-visit and offer routes straight to your team — no brokerage, no spam.
        </p>

        <div className="mt-5 rounded-2xl border border-hx-line bg-white p-4 flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center shrink-0"><BadgeCheck className="w-5 h-5" /></span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-tight truncate">{p.name}</div>
            <div className="text-[12.5px] text-hx-muted truncate">{p.developer}</div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-hx-slate">
              <MapPin className="w-3 h-3" /> {p.locality}{p.city ? `, ${p.city}` : ""}
              {p.reraId && <span className="ml-2 num text-hx-muted">· RERA {p.reraId}</span>}
            </div>
          </div>
        </div>

        <div className="mt-5">
          {claimed ? (
            <div className="rounded-2xl border border-hx-line bg-white p-6 text-center">
              <span className="w-12 h-12 rounded-2xl bg-hx-success/10 text-hx-success inline-flex items-center justify-center mb-3"><BadgeCheck className="w-6 h-6" /></span>
              <div className="text-[16px] font-semibold">This listing is already claimed</div>
              <p className="mt-1.5 text-[13px] text-hx-muted">It&apos;s managed by its verified developer. If this is a mistake, contact us at hello@housex.ai.</p>
            </div>
          ) : (
            <ClaimForm propertyId={p.id} projectName={p.name} developer={p.developer} />
          )}
        </div>
      </div>
    </div>
  );
}
