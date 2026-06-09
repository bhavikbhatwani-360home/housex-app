"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function DevLogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/developer/logout", { method: "POST" });
        router.push("/developer/login");
      }}
      className="inline-flex items-center gap-2 w-full px-3 h-9 rounded-lg text-[13px] font-medium text-hx-slate hover:bg-hx-bg transition-colors"
    >
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  );
}
