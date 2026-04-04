"use client";

import { useState, useCallback } from "react";
import {
  Play, RotateCcw, AlertTriangle, Zap, Scale, ShieldAlert,
  Search, CheckCircle2, RefreshCw, CloudRain, Wifi, MapPinOff, Flame,
  ChevronDown, ChevronUp, ExternalLink, DollarSign
} from "lucide-react";
import Link from "next/link";
import SectionCard from "@/components/SectionCard";
import EngineStepCard from "@/components/EngineStepCard";
import JsonViewer from "@/components/JsonViewer";
import { runSimulation, SEED_WORKER_ID, SEED_ZONE_ID, type SimulationTrace } from "@/lib/apiClient";

const SCENARIOS = [
  {
    id: "rain",
    icon: CloudRain,
    label: "Heavy Rain",
    eventType: "Heavy Rain" as const,
    intensity: 82,
    duration: 4,
    peakOverlap: true,
    color: "sky",
    description: "Monsoon-level rainfall shutting down the HSR Layout zone",
  },
  {
    id: "internet",
    icon: Wifi,
    label: "Internet Shutdown",
    eventType: "Internet Shutdown" as const,
    intensity: 90,
    duration: 3,
    peakOverlap: false,
    color: "amber",
    description: "Carrier-level outage preventing delivery app connectivity",
  },
  {
    id: "zone",
    icon: MapPinOff,
    label: "Zone Closure",
    eventType: "Zone Closure" as const,
    intensity: 70,
    duration: 5,
    peakOverlap: true,
    color: "orange",
    description: "Municipal lockdown of delivery zone during peak hours",
  },
  {
    id: "heat",
    icon: Flame,
    label: "Heat Stress",
    eventType: "Heat Stress" as const,
    intensity: 95,
    duration: 6,
    peakOverlap: false,
    color: "red",
    description: "Extreme heat advisory preventing outdoor delivery work",
  },
];

const ENGINES = [
  { step: 0, key: "trigger" as const, title: "Trigger Engine", icon: Search },
  { step: 1, key: "attribution" as const, title: "Attribution Engine", icon: Scale },
  { step: 2, key: "fraud" as const, title: "Fraud Detection Engine", icon: ShieldAlert },
  { step: 3, key: "payout" as const, title: "Payout Engine", icon: Zap },
];

const colorMap: Record<string, string> = {
  sky: "border-sky-500/40 bg-sky-500/5 text-sky-400 hover:border-sky-500/60",
  amber: "border-amber-500/40 bg-amber-500/5 text-amber-400 hover:border-amber-500/60",
  orange: "border-orange-500/40 bg-orange-500/5 text-orange-400 hover:border-orange-500/60",
  red: "border-red-500/40 bg-red-500/5 text-red-400 hover:border-red-500/60",
};

export default function SimulatePage() {
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawTrace, setShowRawTrace] = useState(false);

  // Custom overrides
  const [customIntensity, setCustomIntensity] = useState(80);
  const [customDuration, setCustomDuration] = useState(4);
  const [peakOverlap, setPeakOverlap] = useState(true);

  const handleRunScenario = useCallback(async (scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario || isRunning) return;

    setIsRunning(true);
    setActiveScenarioId(scenarioId);
    setTrace(null);
    setError(null);

    // Animate through steps while request is in-flight
    let step = 0;
    setCurrentStep(0);
    const ticker = setInterval(() => {
      step = Math.min(step + 1, 3);
      setCurrentStep(step);
    }, 900);

    try {
      const result = await runSimulation({
        workerId: SEED_WORKER_ID,
        zoneId: SEED_ZONE_ID,
        eventType: scenario.eventType,
        intensity: scenario.intensity,
        durationHours: scenario.duration,
        peakOverlap: scenario.peakOverlap,
      });
      clearInterval(ticker);
      setCurrentStep(4);
      setTrace(result);
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof Error ? err.message : "Simulation failed";
      setError(msg);
      setCurrentStep(-1);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const handleRunCustom = useCallback(async () => {
    if (isRunning) return;
    const scenario = SCENARIOS.find((s) => s.id === (activeScenarioId ?? "rain")) ?? SCENARIOS[0];

    setIsRunning(true);
    setTrace(null);
    setError(null);

    let step = 0;
    setCurrentStep(0);
    const ticker = setInterval(() => {
      step = Math.min(step + 1, 3);
      setCurrentStep(step);
    }, 900);

    try {
      const result = await runSimulation({
        workerId: SEED_WORKER_ID,
        zoneId: SEED_ZONE_ID,
        eventType: scenario.eventType,
        intensity: customIntensity,
        durationHours: customDuration,
        peakOverlap,
      });
      clearInterval(ticker);
      setCurrentStep(4);
      setTrace(result);
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof Error ? err.message : "Simulation failed";
      setError(msg);
      setCurrentStep(-1);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, activeScenarioId, customIntensity, customDuration, peakOverlap]);

  const handleReset = () => {
    setTrace(null);
    setError(null);
    setCurrentStep(-1);
    setIsRunning(false);
    setActiveScenarioId(null);
  };

  const decisionColor = trace?.trigger?.decision?.includes("APPROVE")
    ? "text-emerald-400"
    : trace?.trigger?.decision === "REJECT"
    ? "text-red-400"
    : "text-amber-400";

  return (
    <div className="space-y-5 max-w-[1280px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Simulation Lab
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] text-amber-500 font-mono border border-amber-500/20 uppercase tracking-widest">
              Live
            </span>
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Run parametric disruption scenarios through the full AIPS engine pipeline
          </p>
        </div>
        {trace && (
          <button onClick={handleReset} className="btn-secondary text-xs flex items-center gap-1.5">
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Quick-fire scenario buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isActive = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => handleRunScenario(scenario.id)}
              disabled={isRunning}
              className={`card border p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive ? colorMap[scenario.color] : "border-zinc-800/50 hover:border-zinc-700"
              }`}
            >
              <Icon size={18} className={isActive ? "" : "text-zinc-500"} />
              <p className="text-[13px] font-semibold text-zinc-200 mt-2">{scenario.label}</p>
              <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{scenario.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Controls */}
        <div className="lg:col-span-3 space-y-4">
          <SectionCard title="Custom Parameters" className="sticky top-20">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">
                  Intensity: <span className="text-zinc-300">{customIntensity}/100</span>
                </label>
                <input
                  type="range" min="10" max="100" value={customIntensity}
                  onChange={(e) => setCustomIntensity(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">
                  Duration: <span className="text-zinc-300">{customDuration} hrs</span>
                </label>
                <input
                  type="range" min="1" max="12" value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-800/40">
                <label className="text-[11px] text-zinc-400">Peak-Hour Overlap</label>
                <input
                  type="checkbox" checked={peakOverlap}
                  onChange={(e) => setPeakOverlap(e.target.checked)}
                  disabled={isRunning}
                  className="accent-emerald-500 w-4 h-4"
                />
              </div>
              <button
                onClick={handleRunCustom}
                disabled={isRunning}
                className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-400 font-medium text-[12px] border border-emerald-500/30 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {isRunning ? "Processing..." : "Run Custom"}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Center: Engine Pipeline */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
              Engine Pipeline
            </p>
            {trace && (
              <p className="text-[10px] font-mono text-zinc-600">
                ID: {trace.simulation_id.substring(0, 8)}...
              </p>
            )}
          </div>

          {ENGINES.map((engine) => (
            <EngineStepCard
              key={engine.key}
              step={engine.step}
              currentStep={currentStep}
              title={engine.title}
              engineKey={engine.key}
              trace={trace}
            />
          ))}

          {/* Connector arrows */}
          {!trace && !isRunning && currentStep === -1 && (
            <p className="text-[11px] text-zinc-600 text-center pt-2 font-mono">
              Select a scenario above or run custom to start the pipeline.
            </p>
          )}

          {error && (
            <div className="card border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-[12px] text-red-400 font-medium">Simulation Failed</p>
              <p className="text-[11px] text-red-400/70 mt-1">{error}</p>
            </div>
          )}

          {trace && (
            <div className="card border border-zinc-700/50 p-4 bg-zinc-900/40">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <p className="text-[12px] font-mono text-zinc-400">
                  Committed to Supabase · {trace.audit_refs.length} audit log(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/audit?simulation_id=${trace.simulation_id}`}
                  className="btn-secondary text-[11px] flex items-center gap-1.5"
                >
                  <ExternalLink size={11} />
                  View Audit Trail
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-4 space-y-4">
          {!trace && !isRunning && (
            <div className="h-full min-h-[350px] border border-dashed border-zinc-800/50 rounded-lg flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
              <Zap size={28} className="mb-3 opacity-20" />
              <p className="text-[13px] font-medium text-zinc-500">Awaiting Simulation</p>
              <p className="text-[11px] mt-1 text-zinc-600">Choose a scenario to run the pipeline</p>
            </div>
          )}

          {isRunning && !trace && (
            <div className="h-full min-h-[350px] border border-amber-500/20 rounded-lg flex flex-col items-center justify-center text-amber-500/60 p-8 text-center bg-amber-500/5">
              <RefreshCw size={28} className="mb-3 animate-spin" />
              <p className="text-[12px] font-mono">
                {currentStep === 0 && "Running Trigger Engine..."}
                {currentStep === 1 && "Computing Attribution..."}
                {currentStep === 2 && "Checking Fraud Signals..."}
                {currentStep === 3 && "Calculating Payout..."}
              </p>
            </div>
          )}

          {trace && (
            <div className="space-y-4">
              {/* Trigger Decision Banner */}
              <div className={`card p-4 border ${
                trace.trigger.decision.includes("APPROVE")
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : trace.trigger.decision === "REJECT"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                  Trigger Decision
                </p>
                <p className={`text-xl font-bold font-mono ${decisionColor}`}>
                  {trace.trigger.decision}
                </p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800/40 text-[11px] font-mono text-zinc-400">
                  <span>TCS {trace.trigger.TCS.toFixed(3)}</span>
                  <span>·</span>
                  <span>US {trace.trigger.US.toFixed(3)}</span>
                  <span>·</span>
                  <span>Exp {trace.trigger.exposure_score.toFixed(3)}</span>
                </div>
              </div>

              {/* Final Payout */}
              <div className="card p-5">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
                  Final Payout
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-white">
                    ₹{trace.payout.final_payout}
                  </span>
                  {trace.payout.cap_applied && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      CAP APPLIED
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">{trace.payout.explanation}</p>
              </div>

              {/* Why We Paid Panel */}
              <SectionCard title="Why Did We Pay?">
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Expected Income</span>
                    <span className="text-zinc-200">₹{trace.attribution.expected_income}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Raw Loss</span>
                    <span className="text-amber-400">₹{trace.attribution.raw_loss}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Causality Score</span>
                    <span className="text-emerald-400">{trace.attribution.causality_score.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Attributable Loss</span>
                    <span className="text-white">₹{trace.attribution.attributable_loss_amount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Fraud Penalty</span>
                    <span className={trace.fraud.fraud_score > 0.3 ? "text-red-400" : "text-emerald-400"}>
                      {(trace.fraud.fraud_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                    <span className="text-zinc-400">Payout Multiplier</span>
                    <span className="text-sky-400">{trace.fraud.payout_multiplier.toFixed(4)}x</span>
                  </div>
                  {trace.payout.incentive_delta > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-zinc-800/40">
                      <span className="text-zinc-400">Peak Bonus</span>
                      <span className="text-emerald-400">+₹{trace.payout.incentive_delta}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 mt-1">
                    <span className="text-zinc-300 font-semibold">FINAL PAYOUT</span>
                    <span className="text-white font-semibold text-[13px]">₹{trace.payout.final_payout}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Raw Trace Toggle */}
              <button
                onClick={() => setShowRawTrace(!showRawTrace)}
                className="btn-secondary w-full text-[11px] flex items-center justify-center gap-1.5"
              >
                {showRawTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showRawTrace ? "Hide" : "Show"} Raw Trace JSON
              </button>

              {showRawTrace && <JsonViewer data={trace} maxHeight="350px" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
