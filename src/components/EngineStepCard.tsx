"use client";

import { CheckCircle2, RefreshCw, Clock, XCircle } from "lucide-react";
import type { SimulationTrace } from "@/lib/apiClient";

interface EngineStepCardProps {
  step: number;
  currentStep: number;
  title: string;
  engineKey: "trigger" | "attribution" | "fraud" | "payout";
  trace: SimulationTrace | null;
  expandable?: boolean;
}

type StepState = "pending" | "active" | "done" | "idle";

function getStepState(step: number, current: number, trace: SimulationTrace | null): StepState {
  if (trace) return "done";
  if (current === step) return "active";
  if (current > step) return "done";
  return "pending";
}

const engineMetrics: Record<string, (t: SimulationTrace) => { label: string; value: string }[]> = {
  trigger: (t) => [
    { label: "TCS", value: t.trigger.TCS.toFixed(4) },
    { label: "US", value: t.trigger.US.toFixed(4) },
    { label: "Exposure", value: t.trigger.exposure_score.toFixed(4) },
    { label: "Decision", value: t.trigger.decision },
  ],
  attribution: (t) => [
    { label: "Expected Income", value: `₹${t.attribution.expected_income}` },
    { label: "Raw Loss", value: `₹${t.attribution.raw_loss}` },
    { label: "Causality Score", value: t.attribution.causality_score.toFixed(4) },
    { label: "Status", value: t.attribution.status },
  ],
  fraud: (t) => [
    { label: "Fraud Score", value: (t.fraud.fraud_score * 100).toFixed(1) + "%" },
    { label: "Work Probability", value: (t.fraud.work_probability * 100).toFixed(1) + "%" },
    { label: "Payout Multiplier", value: t.fraud.payout_multiplier.toFixed(4) + "x" },
    { label: "Risk Level", value: t.fraud.status },
  ],
  payout: (t) => [
    { label: "Base Loss", value: `₹${t.payout.base_loss}` },
    { label: "Fraud Adj", value: (t.payout.fraud_adjustment * 100).toFixed(1) + "%" },
    { label: "Final Payout", value: `₹${t.payout.final_payout}` },
    { label: "Status", value: t.payout.status },
  ],
};

const stateStyles: Record<StepState, { border: string; icon: React.ReactNode; badge: string }> = {
  idle:    { border: "border-zinc-800/50", icon: <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center"><span className="text-[9px] text-zinc-600 font-mono">—</span></div>, badge: "text-zinc-600" },
  pending: { border: "border-zinc-800/50", icon: <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center"><span className="text-[9px] text-zinc-600 font-mono">—</span></div>, badge: "text-zinc-600" },
  active:  { border: "border-amber-500/40 bg-amber-500/5", icon: <RefreshCw size={14} className="text-amber-400 animate-spin" />, badge: "text-amber-400 bg-amber-400/10" },
  done:    { border: "border-emerald-500/30 bg-emerald-500/5", icon: <CheckCircle2 size={14} className="text-emerald-400" />, badge: "text-emerald-400 bg-emerald-400/10" },
};

export default function EngineStepCard({
  step,
  currentStep,
  title,
  engineKey,
  trace,
}: EngineStepCardProps) {
  const state = getStepState(step, currentStep, trace);
  const styles = stateStyles[state];
  const metrics = trace ? engineMetrics[engineKey]?.(trace) : null;
  const explanation = trace ? (trace[engineKey] as { explanation: string }).explanation : null;

  return (
    <div className={`card border ${styles.border} p-4 transition-all duration-500`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {styles.icon}
          <div>
            <p className="text-[12px] font-semibold text-zinc-200">{title}</p>
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{engineKey}_engine</p>
          </div>
        </div>
        {state === "done" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 font-mono">
            COMPLETE
          </span>
        )}
        {state === "active" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10 border border-amber-400/20 font-mono animate-pulse">
            RUNNING
          </span>
        )}
        {state === "pending" && (
          <Clock size={12} className="text-zinc-700" />
        )}
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-zinc-800/40">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">{m.label}</p>
              <p className="text-[11px] font-mono text-zinc-200 font-medium mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {explanation && (
        <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed italic border-t border-zinc-800/40 pt-3">
          {explanation}
        </p>
      )}
    </div>
  );
}
