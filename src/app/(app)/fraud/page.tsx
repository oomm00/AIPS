"use client";

import { ShieldCheck, ShieldAlert, ShieldX, Eye } from "lucide-react";
import { workerProfile, triggerHistory, earningsHeatmap } from "@/lib/mockData";

const fraudSignals = [
  {
    name: "Location Integrity",
    weight: 0.25,
    score: 0.06,
    detail: "GPS vs accelerometer: consistent. No drift anomaly.",
    status: "clean" as const,
  },
  {
    name: "Activity Authenticity",
    weight: 0.20,
    score: 0.09,
    detail: "Activity quality score: 0.78. Pre-trigger: sustained movement.",
    status: "clean" as const,
  },
  {
    name: "Claim Frequency",
    weight: 0.15,
    score: 0.12,
    detail: "3 claims / 8 weeks. Zone avg: 2.4. Within 2.5× threshold.",
    status: "clean" as const,
  },
  {
    name: "Enrollment Timing",
    weight: 0.10,
    score: 0.0,
    detail: "Policy active for 14 months. No adverse selection signal.",
    status: "clean" as const,
  },
  {
    name: "Baseline Manipulation",
    weight: 0.10,
    score: 0.04,
    detail: "Earnings growth within 1 SD of zone avg. BWE stable.",
    status: "clean" as const,
  },
  {
    name: "Cross-Platform Activity",
    weight: 0.10,
    score: 0.0,
    detail: "Single platform registration. No Swiggy/Zomato crossover detected.",
    status: "clean" as const,
  },
  {
    name: "Zone Coordination",
    weight: 0.05,
    score: 0.0,
    detail: "No synchronized claim patterns in HSR-BLR-07.",
    status: "clean" as const,
  },
  {
    name: "Historical Anomaly",
    weight: 0.05,
    score: 0.02,
    detail: "Clean history. No prior fraud flags. Anomaly score decayed.",
    status: "clean" as const,
  },
];

const computedFraudScore = fraudSignals.reduce(
  (sum, s) => sum + s.weight * s.score,
  0
);

export default function FraudPage() {
  // Work probability curve from heatmap
  const workProbability = earningsHeatmap.map((slot) => ({
    slot: slot.slot,
    probability: Math.min(0.15 + 0.85 * (slot.share / 0.32), 1.0),
  }));

  return (
    <div className="space-y-5 max-w-4xl animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-semibold text-white tracking-tight">
          Fraud Signal Analysis
        </h2>
        <p className="text-[11px] text-zinc-500 mt-1">
          8-signal fraud scoring for {workerProfile.name} · Most recent event
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
            <ShieldCheck size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Composite Score</p>
            <p className="data-value text-xl text-emerald-400 font-semibold">
              {computedFraudScore.toFixed(3)}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
            <ShieldAlert size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Risk Tier</p>
            <p className="text-sm text-emerald-400 font-medium">LOW RISK</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
            <Eye size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Action</p>
            <p className="text-sm text-emerald-400 font-medium">Auto-Approve</p>
          </div>
        </div>
      </div>

      {/* Signal breakdown */}
      <div className="card p-5">
        <h3 className="text-[13px] font-medium text-zinc-300 mb-4">
          Signal Decomposition
        </h3>
        <p className="text-[10px] text-zinc-600 mb-4 font-mono">
          FraudScore = Σ(Wi × Si) = {computedFraudScore.toFixed(4)}
        </p>

        <div className="space-y-2">
          {fraudSignals.map((signal) => {
            const contribution = signal.weight * signal.score;
            const barWidth = Math.max(signal.score * 100, 2);

            return (
              <div
                key={signal.name}
                className="group p-3 rounded-md hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-zinc-300 font-medium">
                      {signal.name}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">
                      w={signal.weight.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-600 font-mono">
                      contrib: {contribution.toFixed(4)}
                    </span>
                    <span className="data-value text-[12px] text-emerald-400">
                      {signal.score.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/40 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {signal.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Work Probability Curve */}
      <div className="card p-5">
        <h3 className="text-[13px] font-medium text-zinc-300 mb-1">
          Work Probability Curve (WPC)
        </h3>
        <p className="text-[10px] text-zinc-600 mb-4">
          P(worker works at time T) — derived from 8-week earnings history
        </p>
        <p className="text-[10px] text-zinc-600 mb-4 font-mono">
          payout_multiplier = 0.15 + 0.85 × work_probability(T)
        </p>

        <div className="space-y-2">
          {workProbability.map((wp) => (
            <div key={wp.slot} className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 font-mono w-[72px] flex-shrink-0 text-right">
                {wp.slot}
              </span>
              <div className="flex-1 h-5 bg-zinc-900 rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${wp.probability * 100}%`,
                    background:
                      wp.probability > 0.8
                        ? "rgba(16, 185, 129, 0.5)"
                        : wp.probability > 0.5
                          ? "rgba(16, 185, 129, 0.3)"
                          : "rgba(16, 185, 129, 0.15)",
                  }}
                />
              </div>
              <span className="data-value text-[11px] text-zinc-300 w-[40px]">
                {(wp.probability * 100).toFixed(0)}%
              </span>
              <span className="data-value text-[10px] text-zinc-600 w-[52px] text-right">
                ×{(0.15 + 0.85 * wp.probability).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision tiers reference */}
      <div className="card p-5">
        <h3 className="text-[13px] font-medium text-zinc-300 mb-4">
          Decision Tier Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-zinc-800/40 text-zinc-500 text-[9px] uppercase tracking-wider">
                <th className="text-left py-2 font-medium">Score Range</th>
                <th className="text-left py-2 font-medium">Tier</th>
                <th className="text-left py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800/20 bg-emerald-500/[0.03]">
                <td className="py-2 font-mono text-emerald-400">0.00 – 0.35</td>
                <td className="py-2">LOW RISK</td>
                <td className="py-2 text-zinc-500">Auto-approve · payout formula runs immediately</td>
              </tr>
              <tr className="border-b border-zinc-800/20">
                <td className="py-2 font-mono text-amber-400">0.35 – 0.60</td>
                <td className="py-2">MEDIUM RISK</td>
                <td className="py-2 text-zinc-500">Zone cluster review</td>
              </tr>
              <tr className="border-b border-zinc-800/20">
                <td className="py-2 font-mono text-orange-400">0.60 – 0.80</td>
                <td className="py-2">HIGH RISK</td>
                <td className="py-2 text-zinc-500">Fast-track human review (2-hour window)</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-red-400">&gt; 0.80</td>
                <td className="py-2">CRITICAL</td>
                <td className="py-2 text-zinc-500">Fast-track review + compliance flag</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-start gap-2 text-[10px] text-zinc-600">
          <ShieldX size={12} className="text-zinc-600 mt-0.5 flex-shrink-0" />
          <span>MVP rule: No auto-deny. HIGH and CRITICAL scores route to fast-track human review.</span>
        </div>
      </div>
    </div>
  );
}
