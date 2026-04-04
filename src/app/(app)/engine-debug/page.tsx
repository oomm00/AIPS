"use client";

import { useState } from "react";
import { TerminalSquare, Play, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import SectionCard from "@/components/SectionCard";
import JsonViewer from "@/components/JsonViewer";
import {
  callTriggerEngine, callAttributionEngine,
  callFraudEngine, callPayoutEngine,
  SEED_WORKER_ID, SEED_ZONE_ID
} from "@/lib/apiClient";

type EngineName = "trigger" | "attribution" | "fraud" | "payout";

const DEFAULT_PAYLOADS: Record<EngineName, string> = {
  trigger: JSON.stringify({
    type: "Heavy Rain",
    zone: "HSR Layout",
    intensity: 82,
    workerActivity: { gpsConfidence: 0.9, recentOrderRatio: 0.85 },
    workerId: SEED_WORKER_ID,
    zoneId: SEED_ZONE_ID
  }, null, 2),

  attribution: JSON.stringify({
    triggerUs: 0.14,
    peakOverlap: true,
    hourlyRate: 106.25,
    eventDurationHours: 4,
    actualIncome: 0,
    marketPulseScore: 0.5,
    historicalIntentScore: 0.8,
    recoveryEvidenceScore: 0.1,
    workerId: SEED_WORKER_ID,
    zoneId: SEED_ZONE_ID
  }, null, 2),

  fraud: JSON.stringify({
    zone: "HSR Layout",
    triggerTcs: 0.88,
    causalityScore: 0.72,
    historicalClaims: 0,
    locationSpoofRisk: 0.05,
    deviceIntegrity: 0.95,
    normalizedTimeWorked: 1.0,
    enrollmentTimingRisk: 0.05,
    workerId: SEED_WORKER_ID,
    zoneId: SEED_ZONE_ID
  }, null, 2),

  payout: JSON.stringify({
    attributableLoss: 450.5,
    fraudProbability: 0.08,
    payoutMultiplier: 0.92,
    coverageCap: 2958,
    peakOverlap: true,
    recoverySuppressionScore: 0.1,
    workerId: SEED_WORKER_ID,
    zoneId: SEED_ZONE_ID
  }, null, 2),
};

const ENGINE_INFO: Record<EngineName, { color: string; description: string }> = {
  trigger:     { color: "sky",    description: "Scores the confidence and uncertainty of a disruption event" },
  attribution: { color: "violet", description: "Computes expected vs actual income loss and causality" },
  fraud:       { color: "red",    description: "Detects behavioral anomalies and sets payout multiplier" },
  payout:      { color: "emerald", description: "Applies adjustments and enforces coverage caps" },
};

const colorMap: Record<string, string> = {
  sky:    "border-sky-500/40 bg-sky-500/5 text-sky-400",
  violet: "border-violet-500/40 bg-violet-500/5 text-violet-400",
  red:    "border-red-500/40 bg-red-500/5 text-red-400",
  emerald:"border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
};

const callers: Record<EngineName, (p: Record<string, unknown>) => Promise<Record<string, unknown>>> = {
  trigger: callTriggerEngine,
  attribution: callAttributionEngine,
  fraud: callFraudEngine,
  payout: callPayoutEngine,
};

function EnginePanel({ engine }: { engine: EngineName }) {
  const info = ENGINE_INFO[engine];
  const c = colorMap[info.color];
  const [payload, setPayload] = useState(DEFAULT_PAYLOADS[engine]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(true);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const run = async () => {
    try {
      setPayloadError(null);
      JSON.parse(payload); // Validate JSON first
    } catch {
      setPayloadError("Invalid JSON in payload");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const res = await callers[engine](parsed);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Engine call failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card border ${c.split(" ")[0]} p-0 overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b border-zinc-800/50 ${c.split(" ")[1]}`}>
        <div className="flex items-center gap-2">
          <TerminalSquare size={14} className={c.split(" ")[2]} />
          <span className="text-[13px] font-semibold text-zinc-200 capitalize">{engine} Engine</span>
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${c}`}>
          /api/{engine}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] text-zinc-500">{info.description}</p>

        {/* Payload editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest">Request Body</label>
            {payloadError && <p className="text-[10px] text-red-400">{payloadError}</p>}
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={8}
            className="w-full bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 rounded-md px-3 py-2 font-mono focus:outline-none focus:border-zinc-600 resize-y"
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className={`w-full py-2 border rounded-md text-[12px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${c}`}
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
          {loading ? "Running..." : "Call Engine"}
        </button>

        {error && (
          <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 font-mono">
            {error}
          </p>
        )}

        {result && (
          <div>
            <button
              onClick={() => setShowResult(!showResult)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mb-2 transition-colors"
            >
              {showResult ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Response ({showResult ? "hide" : "show"})
            </button>
            {showResult && <JsonViewer data={result} maxHeight="300px" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EngineDebugPage() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
      <div className="pb-2 border-b border-zinc-800/50">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <TerminalSquare size={22} className="text-zinc-500" />
          Engine Debug Lab
        </h1>
        <p className="text-[12px] text-zinc-500 mt-1">
          Call each engine independently · Edit payloads · Inspect raw responses
        </p>
      </div>

      <div className="card p-4 border-amber-500/20 bg-amber-500/5">
        <p className="text-[11px] text-amber-400">
          <strong>Note:</strong> Each standalone call creates a stub simulation_event row to satisfy FK constraints.
          For a full orchestrated trace, use the{" "}
          <a href="/simulate" className="underline">Simulation Lab</a>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(["trigger", "attribution", "fraud", "payout"] as EngineName[]).map((engine) => (
          <EnginePanel key={engine} engine={engine} />
        ))}
      </div>
    </div>
  );
}
