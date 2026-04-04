"use client";

import { ReactNode, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Clock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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
type StepTone = "neutral" | "success" | "warning";

function getStepState(step: number, current: number, trace: SimulationTrace | null): StepState {
  if (trace) return "done";
  if (current === step) return "active";
  if (current > step) return "done";
  return "pending";
}

function getStepTone(engineKey: EngineStepCardProps["engineKey"], trace: SimulationTrace | null): StepTone {
  if (!trace) return "neutral";
  if (engineKey === "trigger") {
    return trace.trigger.decision.includes("APPROVE") ? "success" : "warning";
  }
  if (engineKey === "fraud") {
    return trace.fraud.fraud_score > 0.3 ? "warning" : "success";
  }
  if (engineKey === "payout") {
    return trace.payout.final_payout > 0 ? "success" : "warning";
  }
  return trace.attribution.causality_score >= 0.5 ? "success" : "warning";
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

const stateStyles: Record<StepState, { border: string; icon: ReactNode }> = {
  idle:    { border: "border-[rgba(255,255,255,0.05)] opacity-50", icon: <div className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center"><span className="text-[9px] text-gray-500 font-mono">—</span></div> },
  pending: { border: "border-[rgba(255,255,255,0.05)] opacity-50", icon: <div className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center"><span className="text-[9px] text-gray-500 font-mono">—</span></div> },
  active:  { border: "border-sky-500/40 bg-sky-500/5 shadow-glow-sky z-10", icon: <RefreshCw size={14} className="text-sky-400 animate-spin" /> },
  done:    { border: "border-emerald-500/30 bg-[#111827]/80 backdrop-blur-md shadow-glass", icon: <CheckCircle2 size={16} className="text-emerald-400" /> },
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
  const tone = getStepTone(engineKey, trace);
  const [expanded, setExpanded] = useState(false);
  const metrics = trace ? engineMetrics[engineKey]?.(trace) : null;
  const explanation = trace ? (trace[engineKey] as { explanation?: string }).explanation ?? "No explanation available." : "Waiting for this step to execute.";

  const badgeClassName = useMemo(() => {
    if (state === "active") return "border border-sky-400/25 bg-sky-400/10 text-sky-300";
    if (state !== "done") return "border border-gray-600/40 bg-gray-500/10 text-gray-400";
    if (tone === "warning") return "border border-amber-400/25 bg-amber-400/10 text-amber-300";
    return "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  }, [state, tone]);

  const badgeLabel = state === "active" ? "Running" : state !== "done" ? "Pending" : tone === "warning" ? "Warning" : "Success";

  return (
    <div className={`card ${styles.border} p-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${state === 'active' || state === 'done' ? 'animate-fade-in' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 w-full">
          {styles.icon}
          <div>
            <p className={`text-sm font-semibold tracking-tight ${state === 'idle' || state === 'pending' ? 'text-gray-500' : 'text-gray-100'}`}>{title}</p>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{engineKey}_engine</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {state === "pending" && (
            <Clock size={14} className="text-gray-600" />
          )}
          {state !== "pending" && (
            <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${badgeClassName}`}>
              {badgeLabel}
            </span>
          )}
        </div>
      </div>

      {state === "active" && (
        <div className="mb-4 h-1.5 w-full rounded-full bg-sky-400/10">
          <div className="h-1.5 w-2/3 rounded-full bg-sky-400/70 animate-pulse-slow" />
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] animate-slide-up">
          {metrics.map((m) => (
            <div key={m.label} className="bg-[rgba(255,255,255,0.02)] p-2 rounded-lg border border-[rgba(255,255,255,0.02)]">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-xs font-mono text-gray-200 font-semibold mt-1">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <p className="text-sm text-gray-400 leading-relaxed">{explanation}</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-gray-100"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide details" : "Expand details"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
          {metrics ? (
            <ul className="space-y-2">
              {metrics.map((metric) => (
                <li key={metric.label} className="flex items-center justify-between gap-3">
                  <span className="text-gray-400">{metric.label}</span>
                  <span className="font-medium text-gray-100">{metric.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle size={14} />
              Awaiting run data for this step.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
