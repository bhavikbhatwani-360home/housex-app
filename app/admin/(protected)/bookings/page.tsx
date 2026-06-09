import { Lock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

async function getBookings() {
  try {
    const bookings = await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return { bookings, dbError: false };
  } catch {
    return { bookings: [], dbError: true };
  }
}

export default async function AdminBookings() {
  const { bookings, dbError } = await getBookings();
  const total = bookings.reduce((s, b) => s + (b.status === "Paid" ? b.amount : 0), 0);

  return (
    <div>
      <header className="h-14 border-b border-hx-line bg-white flex items-center px-6">
        <h1 className="text-[16px] font-semibold tracking-tight flex items-center gap-2">
          <Lock className="w-4 h-4 text-hx-red" /> Token bookings
          <span className="num text-[12px] font-medium text-hx-muted">{bookings.length}</span>
        </h1>
        {bookings.length > 0 && <span className="ml-auto num text-[13px] font-semibold">₹{total.toLocaleString("en-IN")} collected</span>}
      </header>
      <div className="p-6">
        {dbError ? (
          <div className="rounded-xl border border-hx-line bg-white p-5 flex items-start gap-3 max-w-xl">
            <AlertCircle className="w-5 h-5 text-hx-warning shrink-0 mt-0.5" />
            <div className="text-[14px] font-semibold">Database not connected yet</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-hx-line bg-white p-10 text-center max-w-xl mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-hx-red/8 text-hx-red inline-flex items-center justify-center mb-4"><Lock className="w-7 h-7" /></span>
            <div className="text-[15px] font-semibold">No token bookings yet</div>
            <p className="text-[13px] text-hx-muted mt-1">₹999 token payments from buyers show up here.</p>
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
