"use client";

import { useState, useCallback } from "react";
import {
  Play, RotateCcw, AlertTriangle, Zap, Scale, ShieldAlert,
  Search, CheckCircle2, RefreshCw, CloudRain, Wifi, MapPinOff, Flame,
  ChevronDown, ChevronUp, ExternalLink, BarChart, ArrowRight
} from "lucide-react";
import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
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
    description: "Monsoon-level rainfall shutting down the zone",
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
    description: "Carrier-level outage preventing connectivity",
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
    description: "Municipal lockdown of delivery zone",
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
    description: "Extreme heat advisory halting work",
  },
];

const ENGINES = [
  { step: 0, key: "trigger" as const, title: "Trigger Engine", icon: <Search size={18} /> },
  { step: 1, key: "attribution" as const, title: "Attribution Engine", icon: <Scale size={18} /> },
  { step: 2, key: "fraud" as const, title: "Fraud Detection Engine", icon: <ShieldAlert size={18} /> },
  { step: 3, key: "payout" as const, title: "Payout Engine", icon: <Zap size={18} /> },
];

const colorMap: Record<string, string> = {
  sky: "border-sky-500/40 bg-sky-500/5 text-sky-400 shadow-glow-sky border-sky-400 font-medium",
  amber: "border-amber-500/40 bg-amber-500/5 text-amber-400 shadow-glow-amber border-amber-400 font-medium",
  orange: "border-orange-500/40 bg-orange-500/5 text-orange-400 shadow-glow-amber border-orange-400 font-medium",
  red: "border-red-500/40 bg-red-500/5 text-red-400 shadow-glow-red border-red-400 font-medium",
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

    let step = 0;
    setCurrentStep(0);
    const ticker = setInterval(() => {
      step = Math.min(step + 1, 3);
      setCurrentStep(step);
    }, 1100);

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
    }, 1100);

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
    <div className="space-y-8 max-w-[1280px] mx-auto pb-12 animate-fade-in">
      <SectionHeader
        title="Simulation Lab"
        subtitle="Run parametric disruption scenarios through the full AIPS engine pipeline."
        badge={
          <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
            Live System
          </span>
        }
        action={
          trace ? (
            <button onClick={handleReset} className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm">
              <RotateCcw size={16} />
              Reset
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-[#111827]/70 p-4 md:grid-cols-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 md:col-span-1 md:self-center">Pipeline</p>
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-7 items-center gap-2 text-sm">
          <span className="rounded-lg bg-sky-500/10 px-3 py-2 text-center font-medium text-sky-300 sm:col-span-1">Trigger</span>
          <ArrowRight size={14} className="mx-auto hidden text-gray-500 sm:block" />
          <span className="rounded-lg bg-violet-500/10 px-3 py-2 text-center font-medium text-violet-300 sm:col-span-1">Attribution</span>
          <ArrowRight size={14} className="mx-auto hidden text-gray-500 sm:block" />
          <span className="rounded-lg bg-amber-500/10 px-3 py-2 text-center font-medium text-amber-300 sm:col-span-1">Fraud</span>
          <ArrowRight size={14} className="mx-auto hidden text-gray-500 sm:block" />
          <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center font-medium text-emerald-300 sm:col-span-1">Payout</span>
        </div>
      </div>

      {/* Quick-fire scenario buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isActive = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => handleRunScenario(scenario.id)}
              disabled={isRunning}
              className={`card flex flex-col items-start p-5 text-left transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive ? colorMap[scenario.color] : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <div className={`p-2.5 rounded-lg mb-3 ${isActive ? 'bg-black/20' : 'bg-[#111827] border border-[rgba(255,255,255,0.05)]'}`}>
                <Icon size={20} className={isActive ? "" : "text-gray-400"} />
              </div>
              <p className={`text-base font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>{scenario.label}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-snug font-medium pr-2">{scenario.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Controls */}
        <div className="lg:col-span-3 space-y-5">
          <SectionCard title="Custom Parameters" className="sticky top-20 bg-[#111827]/60">
            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex justify-between font-semibold">
                  Intensity <span className="text-emerald-400">{customIntensity}/100</span>
                </label>
                <input
                  type="range" min="10" max="100" value={customIntensity}
                  onChange={(e) => setCustomIntensity(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-emerald-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-widest mb-3 flex justify-between font-semibold">
                  Duration <span className="text-emerald-400">{customDuration} hrs</span>
                </label>
                <input
                  type="range" min="1" max="12" value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full accent-emerald-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-[rgba(255,255,255,0.06)]">
                <label className="text-sm text-gray-300 font-medium">Peak-Hour Overlap</label>
                <input
                  type="checkbox" checked={peakOverlap}
                  onChange={(e) => setPeakOverlap(e.target.checked)}
                  disabled={isRunning}
                  className="accent-emerald-500 w-5 h-5 rounded cursor-pointer"
                />
              </div>
              <button
                onClick={handleRunCustom}
                disabled={isRunning}
                className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
              >
                {isRunning ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} className="fill-[#09090b]" />}
                {isRunning ? "Running Pipeline..." : "Force Simulation"}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Center: Engine Pipeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <BarChart size={16} /> Pipeline Orchestrator
            </p>
            {trace && (
              <p className="text-xs font-mono text-emerald-500/70 py-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                ID: {trace.simulation_id.substring(0, 8)}
              </p>
            )}
          </div>

          <div className="space-y-4">
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
          </div>

          {!trace && !isRunning && currentStep === -1 && (
            <div className="py-6 border-2 border-dashed border-[rgba(255,255,255,0.05)] rounded-2xl text-center">
              <p className="text-sm text-gray-500 font-medium">
                Select a scenario to witness the automated zero-claim pipeline.
              </p>
            </div>
          )}

          {error && (
            <div className="card mt-4 border border-red-500/30 bg-red-500/5 p-5 shadow-glow-red animate-scale-in">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle size={18} className="text-red-400" />
                <p className="text-sm text-red-400 font-bold">Simulation Failed</p>
              </div>
              <p className="text-xs text-red-400/80 font-mono">{error}</p>
            </div>
          )}

          {trace && (
            <div className="card mt-4 border border-emerald-500/20 p-5 bg-gradient-to-r from-emerald-500/10 to-transparent shadow-glow-emerald animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex flex-col items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">Database Committed</h4>
                    <p className="text-[11px] font-mono text-emerald-400/70 mt-0.5">
                      {trace.audit_refs.length} secured audit logs generated
                    </p>
                  </div>
                </div>
                <Link
                  href={`/audit?simulation_id=${trace.simulation_id}`}
                  className="btn-secondary text-xs flex items-center gap-1.5 border-emerald-500/30 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink size={14} />
                  View Trace
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-4 space-y-6">
          {!trace && !isRunning && (
            <div className="h-[400px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.01)] rounded-2xl flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-4">
                <Zap size={28} className="opacity-40" />
              </div>
              <p className="text-base font-bold text-gray-400">Awaiting Simulation</p>
              <p className="text-sm mt-2 text-gray-500 max-w-[200px]">The orchestrator is idle. Trigger an event to begin process.</p>
            </div>
          )}

          {isRunning && !trace && (
            <div className="h-[400px] border border-sky-500/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-sky-500/5 to-[rgba(255,255,255,0.02)] shadow-glow-sky animate-pulse-slow">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-sky-500 blur-xl opacity-30 rounded-full"></div>
                <RefreshCw size={40} className="relative text-sky-400 animate-spin" />
              </div>
              <p className="text-sm font-mono text-sky-400 font-semibold tracking-widest uppercase">
                {currentStep === 0 && "Parsing Live Telemetry..."}
                {currentStep === 1 && "Computing Causal Loss..."}
                {currentStep === 2 && "Isolating Fraud Signals..."}
                {currentStep === 3 && "Executing Final Payout..."}
              </p>
            </div>
          )}

          {trace && (
            <div className="space-y-5 animate-slide-up">
              
              {/* Trigger Decision Banner */}
              <div className={`card p-6 border-l-4 ${
                trace.trigger.decision.includes("APPROVE")
                  ? "border-emerald-500 bg-emerald-500/5 shadow-glow-emerald"
                  : trace.trigger.decision === "REJECT"
                  ? "border-red-500 bg-red-500/5 shadow-glow-red"
                  : "border-amber-500 bg-amber-500/5 shadow-glow-amber"
              }`}>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1 font-semibold">
                  Event Determination
                </p>
                <p className={`text-2xl font-black font-mono tracking-tight mt-1 ${decisionColor}`}>
                  {trace.trigger.decision}
                </p>
                <div className="flex gap-4 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] text-xs font-mono text-gray-400 bg-[rgba(255,255,255,0.02)] -mx-6 mb-[-1.5rem] px-6 pb-4 pt-3 rounded-b-xl">
                  <div className="flex flex-col"><span className="text-[9px] text-gray-500">TCS</span><span className="font-bold text-gray-300">{trace.trigger.TCS.toFixed(3)}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] text-gray-500">US</span><span className="font-bold text-gray-300">{trace.trigger.US.toFixed(3)}</span></div>
                  <div className="flex flex-col"><span className="text-[9px] text-gray-500">EXP</span><span className="font-bold text-gray-300">{trace.trigger.exposure_score.toFixed(3)}</span></div>
                </div>
              </div>

              {/* Final Payout - Huge */}
              <div className="card p-8 bg-gradient-to-br from-[#111827] to-[#0A1017] border-[rgba(255,255,255,0.08)] shadow-glass text-center relative overflow-hidden">
                {/* Background flare */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none rounded-full"></div>
                
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Approved Disbursement
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[3.5rem] leading-none font-black font-mono text-white tracking-tighter">
                    ₹{trace.payout.final_payout}
                  </span>
                </div>
                
                {trace.payout.cap_applied && (
                  <div className="inline-block mt-4 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full font-bold tracking-widest shadow-glow-amber">
                    MAXIMUM POLICY CAP APPLIED
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-5 max-w-[250px] mx-auto leading-relaxed border-t border-[rgba(255,255,255,0.06)] pt-4">
                  {trace.payout.explanation}
                </p>
              </div>

              {/* Explainability Block */}
              <SectionCard title="Why Did We Pay This?" subtitle="Transparent payout rationale with deterministic factors">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                    <span className="text-gray-500 font-sans">Expected Run-Rate</span>
                    <span className="text-gray-100 font-bold">₹{trace.attribution.expected_income}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                    <span className="text-gray-500 font-sans">Detected Earnings</span>
                    <span className="text-amber-400 font-bold">₹{trace.attribution.actual_income}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)] bg-sky-500/5 -mx-6 px-6">
                    <span className="text-sky-400 font-sans font-semibold">Causal Loss (Base)</span>
                    <span className="text-sky-400 font-bold">₹{trace.attribution.attributable_loss_amount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                    <span className="text-gray-500 font-sans">Fraud Integrity</span>
                    <span className={trace.fraud.fraud_score > 0.3 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                      {(trace.fraud.fraud_score * 100).toFixed(1)}% Penalty
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
                    <span className="text-gray-500 font-sans">Behavior Adjustment</span>
                    <span className="text-gray-300 font-bold">{trace.fraud.payout_multiplier.toFixed(4)}x</span>
                  </div>
                  {trace.payout.incentive_delta > 0 && (
                    <div className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)] bg-emerald-500/5 -mx-6 px-6">
                      <span className="text-emerald-400 font-sans font-semibold">Peak Opportunity Bonus</span>
                      <span className="text-emerald-400 font-bold">+₹{trace.payout.incentive_delta}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 pb-1 mt-1">
                    <span className="text-white font-sans font-black uppercase text-sm">Transfer Queued</span>
                    <span className="text-emerald-400 font-black text-xl">₹{trace.payout.final_payout}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Raw Trace Toggle */}
              <button
                onClick={() => setShowRawTrace(!showRawTrace)}
                className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2 font-medium"
              >
                {showRawTrace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showRawTrace ? "Hide" : "Show"} Developer Raw JSON Trace
              </button>

              {showRawTrace && <JsonViewer data={trace} maxHeight="400px" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
