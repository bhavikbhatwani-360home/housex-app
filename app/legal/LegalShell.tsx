import Link from "next/link";

export default function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-hx-ink">
      <nav className="px-5 sm:px-8 py-3.5 border-b border-hx-line/70 flex items-center bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[9px] bg-hx-red inline-flex items-center justify-center shadow-hx-red">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/housex-mark-white.png" alt="HouseX" className="w-[66%] h-[66%] object-contain" />
          </span>
          <span className="text-[17px] font-medium tracking-tight">HouseX</span>
        </Link>
      </nav>
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[12.5px] text-hx-muted">Last updated: {updated}</p>
        <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-hx-slate [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-hx-ink [&_h2]:mt-2">
          {children}
        </div>
      </main>
    </div>
  );
}
