import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function ChatStub() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[320px]">
        <span className="inline-flex w-16 h-16 rounded-full bg-hx-red text-white items-center justify-center shadow-hx-red mb-5">
          <Sparkles className="w-7 h-7" />
        </span>
        <h1 className="text-[22px] font-extrabold tracking-tight">Baba chat — coming next</h1>
        <p className="mt-2 text-[14px] text-hx-slate leading-relaxed">
          Your onboarding is captured. The live chat with Baba is the next screen we&apos;re building.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex items-center gap-2 px-4 h-11 rounded-2xl bg-white border border-hx-line text-[14px] font-semibold shadow-hx-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to onboarding
        </Link>
      </div>
    </div>
  );
}
