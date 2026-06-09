import { Users2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getMember } from "@/lib/devauth";
import TeamManager from "./TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await getMember();
  if (!me) return null;

  let members: { id: string; email: string; name: string | null; role: string }[] = [];
  try {
    members = await prisma.teamMember.findMany({
      where: { developerId: me.developerId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Users2 className="w-4 h-4 text-hx-red" /> Team
          <span className="num text-[12px] font-medium text-hx-muted">{members.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {!me.developer ? null : (
          <>
            {me.role !== "owner" && (
              <p className="text-[13px] text-hx-muted mb-4">Your team at {me.developer.company}. Only the owner can add or remove members.</p>
            )}
            <TeamManager members={members} isOwner={me.role === "owner"} meId={me.id} />
          </>
        )}
      </div>
    </div>
  );
}
