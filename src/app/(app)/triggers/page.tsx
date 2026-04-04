"use client";

import EventTimeline from "@/components/EventTimeline";
import { triggerHistory, workerProfile } from "@/lib/mockData";

export default function TriggersPage() {
  const paid = triggerHistory.filter((e) => e.status === "paid");
  const rejected = triggerHistory.filter((e) => e.status === "rejected");
  const totalPaid = paid.reduce((s, e) => s + (e.payoutAmount || 0), 0);

  return (
    <div className="space-y-5 max-w-4xl animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-semibold text-white tracking-tight">
          Trigger History
        </h2>
        <p className="text-[11px] text-zinc-500 mt-1">
          All disruption events evaluated for {workerProfile.name} · {workerProfile.zone}
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: triggerHistory.length.toString(), accent: "text-zinc-200" },
          { label: "Approved", value: paid.length.toString(), accent: "text-emerald-400" },
          { label: "Rejected", value: rejected.length.toString(), accent: "text-red-400" },
          { label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}`, accent: "text-emerald-400" },
        ].map((item) => (
          <div key={item.label} className="card p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-1">
              {item.label}
            </p>
            <p className={`data-value text-xl font-semibold ${item.accent}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed decision breakdown per event */}
      <div className="card p-4">
        <h3 className="text-[13px] font-medium text-zinc-300 mb-1">
          Decision Pipeline Trace
        </h3>
        <p className="text-[10px] text-zinc-600 mb-4">
          TCS (Trigger Confidence Score) · US (Uncertainty Score) · Each event is independently evaluated
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-zinc-800/40 text-zinc-500 text-[9px] uppercase tracking-wider">
                <th className="text-left py-2 font-medium">Event</th>
                <th className="text-left py-2 font-medium">Date</th>
                <th className="text-right py-2 font-medium">TCS</th>
                <th className="text-right py-2 font-medium">US</th>
                <th className="text-right py-2 font-medium">Exposure</th>
                <th className="text-right py-2 font-medium">Causality</th>
                <th className="text-right py-2 font-medium">Fraud</th>
                <th className="text-right py-2 font-medium">Payout</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {triggerHistory.map((evt) => (
                <tr key={evt.id} className="border-b border-zinc-800/20 hover:bg-white/[0.01] transition-colors">
                  <td className="py-2.5 text-zinc-300 font-mono capitalize">{evt.type}</td>
                  <td className="py-2.5 text-zinc-500 font-mono">{evt.date}</td>
                  <td className="py-2.5 text-right font-mono">
                    <span className={evt.tcs > 0.75 ? "text-emerald-400" : evt.tcs > 0.50 ? "text-amber-400" : "text-red-400"}>
                      {evt.tcs.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono">
                    <span className={evt.us < 0.30 ? "text-emerald-400" : evt.us < 0.50 ? "text-amber-400" : "text-red-400"}>
                      {evt.us.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-zinc-400">{evt.exposureScore.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono text-zinc-400">{evt.causalityScore.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">
                    <span className={evt.fraudScore < 0.35 ? "text-emerald-400" : "text-amber-400"}>
                      {evt.fraudScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-white">
                    {evt.payoutAmount ? `₹${evt.payoutAmount}` : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      evt.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : evt.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {evt.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full event timeline */}
      <div className="card p-4">
        <h3 className="text-[13px] font-medium text-zinc-300 mb-4">
          Event Feed
        </h3>
        <EventTimeline events={triggerHistory} />
      </div>
    </div>
  );
}
