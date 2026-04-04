"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Activity, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Play, CheckCircle2 } from "lucide-react";
import SectionCard from "@/components/SectionCard";
import StatusBadge from "@/components/StatusBadge";
import KeyMetricCard from "@/components/KeyMetricCard";
import { LoadingState, ErrorState } from "@/components/States";
import {
  fetchWorkers, fetchPolicies, fetchPremiumQuote, createPolicyQuote,
  SEED_WORKER_ID, type ApiWorker, type ApiPolicy, type ApiPremiumResult
} from "@/lib/apiClient";

export default function PolicyPage() {
  const [worker, setWorker] = useState<ApiWorker | null>(null);
  const [policy, setPolicy] = useState<ApiPolicy | null>(null);
  const [quote, setQuote] = useState<ApiPremiumResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [workers, policies, premiumResult] = await Promise.all([
        fetchWorkers(),
        fetchPolicies(SEED_WORKER_ID),
        fetchPremiumQuote(SEED_WORKER_ID),
      ]);

      const w = workers.find((w) => w.id === SEED_WORKER_ID) ?? workers[0] ?? null;
      setWorker(w);
      setPolicy(policies.find((p) => p.status === "active") ?? policies[0] ?? null);
      setQuote(premiumResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load policy data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleActivate = async () => {
    if (!worker || activating) return;
    try {
      setActivating(true);
      const zone = worker.zones;
      await createPolicyQuote({
        worker_id: worker.id,
        zone_risk_index: zone?.zri ?? 1.18,
        recent_claims_anomaly: 0,
        activate: true,
      });
      setActivated(true);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  if (loading) return <LoadingState message="Loading policy data..." />;
  if (error) return <ErrorState message="Failed to load policy" detail={error} onRetry={load} />;

  const zri = worker?.zones?.zri ?? 1.18;
  const d = quote?.data;
  const bwe = d?.base_weekly_exposure ?? policy?.bwe ?? 0;
  const premium = d?.final_premium ?? policy?.weekly_premium ?? 0;
  const coverageLimit = quote?.coverage_limit ?? policy?.coverage_limit ?? 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Coverage Profile
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Parametric policy management · Weekly premium · Coverage limits
          </p>
        </div>
        {policy && (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            ACTIVE POLICY
          </span>
        )}
      </div>

      {/* Worker Snapshot */}
      {worker && (
        <SectionCard title="Worker Profile" noPadding>
          <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-semibold text-zinc-300 font-mono">
                {worker.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold text-white">{worker.name}</h2>
                  <StatusBadge status="active" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-zinc-500" />
                    {worker.zones?.name ?? worker.zone_id} · {worker.zones?.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity size={12} className="text-zinc-500" />
                    {worker.platform}
                  </span>
                  <span className="text-zinc-600">ID: {worker.id.substring(0, 8)}</span>
                </div>
              </div>
            </div>
            <div className="md:border-l border-zinc-800/50 md:pl-6">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                Coverage Status
              </p>
              <StatusBadge status={policy ? "active" : "review"} size="md" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KeyMetricCard
          label="Weekly Premium"
          value={`₹${premium}`}
          sub="Computed by premium engine"
          accent="emerald"
        />
        <KeyMetricCard
          label="Coverage Limit"
          value={`₹${coverageLimit}`}
          sub="Weekly cap on payouts"
          accent="sky"
        />
        <KeyMetricCard
          label="Base Weekly Earning"
          value={`₹${bwe.toFixed(0)}`}
          sub="Median from work history"
          accent="zinc"
        />
        <KeyMetricCard
          label="Zone Risk Index"
          value={zri.toFixed(2)}
          unit="× ZRI"
          sub={`${worker?.zones?.name ?? 'Zone'} · ${worker?.zones?.city}`}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Premium Breakdown */}
        <div className="lg:col-span-8">
          <SectionCard
            title="Premium Formula Breakdown"
            badge={quote?.eligibility
              ? <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-400/20">ELIGIBLE</span>
              : <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-400/20">INELIGIBLE</span>
            }
            headerRight={
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            }
          >
            {showBreakdown && (
              <div className="space-y-1">
                {/* Formula explanation */}
                <div className="mb-4 p-3 bg-zinc-900/50 rounded-md border border-zinc-800/50">
                  <p className="text-[10px] font-mono text-zinc-500">
                    Premium = BWE × 5% × ZRI × WI × TE × RA
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    All factors are deterministic. No ML black-box.
                  </p>
                </div>

                {[
                  { label: "Base Weekly Earnings (BWE)", value: `₹${bwe.toFixed(0)}`, formula: "Median earnings from work history", color: "text-zinc-200" },
                  { label: "Base Rate", value: "5%", formula: "Fixed parametric baseline", color: "text-zinc-300" },
                  { label: "Zone Risk Index (ZRI)", value: `${d?.zone_multiplier?.toFixed(4) ?? zri}×`, formula: `${worker?.zones?.name} zone risk factor`, color: "text-amber-400" },
                  { label: "Work Intensity Factor (WI)", value: `${d?.work_intensity_factor?.toFixed(4) ?? "—"}×`, formula: "BWE / 5000, clamped 0.8–1.5", color: "text-sky-400" },
                  { label: "Time Exposure Factor (TE)", value: `${d?.time_exposure_factor?.toFixed(4) ?? "—"}×`, formula: "Earnings concentration in risky hours", color: "text-violet-400" },
                  { label: "Risk Adjustment (RA)", value: `${d?.risk_adjustment?.toFixed(4) ?? "1.0"}×`, formula: "Recent claims anomaly multiplier", color: "text-orange-400" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-zinc-800/40 last:border-0">
                    <div>
                      <p className="text-[12px] text-zinc-300">{row.label}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">{row.formula}</p>
                    </div>
                    <span className={`text-[13px] font-mono font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}

                <div className="pt-3 flex justify-between items-center">
                  <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">Final Weekly Premium</span>
                  <span className="text-2xl font-mono text-white font-bold">₹{premium}</span>
                </div>

                {quote?.explanation && (
                  <p className="mt-3 text-[11px] text-zinc-500 italic leading-relaxed border-t border-zinc-800/40 pt-3">
                    {quote.explanation}
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Policy Action */}
        <div className="lg:col-span-4 space-y-4">
          {policy ? (
            <SectionCard title="Active Policy">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/40">
                  <span className="text-[11px] text-zinc-400">Policy ID</span>
                  <span className="text-[11px] font-mono text-zinc-300">{policy.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/40">
                  <span className="text-[11px] text-zinc-400">Weekly Premium</span>
                  <span className="text-[13px] font-mono text-emerald-400">₹{policy.weekly_premium}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/40">
                  <span className="text-[11px] text-zinc-400">Coverage Limit</span>
                  <span className="text-[13px] font-mono text-sky-400">₹{policy.coverage_limit}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/40">
                  <span className="text-[11px] text-zinc-400">BWE (Base)</span>
                  <span className="text-[13px] font-mono text-zinc-200">₹{policy.bwe}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[11px] text-zinc-400">Status</span>
                  <StatusBadge status={policy.status === "active" ? "active" : "review"} />
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Activate Coverage">
              <div className="text-center py-4 space-y-4">
                {activated ? (
                  <div className="text-center">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-[13px] font-medium text-zinc-200">Policy Activated!</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Your coverage is now active.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-zinc-400 leading-relaxed">
                      No active policy found. Generate a quote and activate coverage.
                    </p>
                    {quote?.eligibility && (
                      <div className="card p-3 text-left">
                        <p className="text-[10px] text-zinc-500 mb-1">Computed Premium</p>
                        <p className="text-2xl font-mono text-white">₹{premium}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">/ week</p>
                      </div>
                    )}
                    <button
                      onClick={handleActivate}
                      disabled={activating || !quote?.eligibility}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                      {activating ? "Activating..." : "Activate Policy"}
                    </button>
                    {!quote?.eligibility && (
                      <p className="text-[10px] text-red-400/80">{quote?.explanation ?? "Not eligible for coverage"}</p>
                    )}
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {/* Eligibility note */}
          <div className="card p-4 border-zinc-800/50">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Eligibility Rules</p>
            <div className="space-y-2 text-[11px] text-zinc-500">
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${(worker?.id ? true : false) ? "bg-emerald-500/60" : "bg-zinc-700"}`} />
                Min. 8 weeks work history
              </div>
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${bwe >= 1500 ? "bg-emerald-500/60" : "bg-zinc-700"}`} />
                Median earnings ≥ ₹1,500/day
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 w-3 h-3 rounded-full flex-shrink-0 bg-emerald-500/60" />
                Active in verified zone
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
