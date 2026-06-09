import { Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getDeveloper } from "@/lib/devauth";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function DevBookings() {
  const dev = await getDeveloper();
  if (!dev) return null;

  let bookings: { id: string; propertyName: string; buyerName: string; buyerPhone: string; amount: number; status: string; createdAt: Date }[] = [];
  try {
    bookings = await prisma.booking.findMany({
      where: { developerId: dev.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, propertyName: true, buyerName: true, buyerPhone: true, amount: true, status: true, createdAt: true },
    });
  } catch {}

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Lock className="w-4 h-4 text-hx-red" /> Token bookings
          <span className="num text-[12px] font-medium text-hx-muted">{bookings.length}</span>
        </h1>
      </header>
      <div className="p-6">
        {bookings.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Lock className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No token bookings yet</div>
            <p className="text-[13px] text-hx-muted mt-1">When a buyer pays the ₹999 token to block one of your homes, it shows here — a committed, ready-to-close buyer.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-hx-line bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hx-line text-[11px] uppercase tracking-wider text-hx-muted">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-hx-line last:border-0 hover:bg-hx-bg/60">
                    <td className="px-4 py-3 text-[13.5px] font-medium">{b.propertyName}</td>
                    <td className="px-4 py-3 text-[13px] text-hx-slate">{b.buyerName}</td>
                    <td className="px-4 py-3 num text-[13px] text-hx-slate">{b.buyerPhone}</td>
                    <td className="px-4 py-3 num text-[13px] font-semibold">₹{b.amount}</td>
                    <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-hx-success/10 text-hx-success">{b.status}</span></td>
                    <td className="px-4 py-3 text-right num text-[12.5px] text-hx-muted">{fmt(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
