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

  if (loading) return <LoadingState message="Reconstructing coverage profile..." />;
  if (error) return <ErrorState message="Failed to load policy" detail={error} onRetry={load} />;

  const zri = worker?.zones?.zri ?? 1.18;
  const d = quote?.data;
  const bwe = d?.base_weekly_exposure ?? policy?.bwe ?? 0;
  const premium = d?.final_premium ?? policy?.weekly_premium ?? 0;
  const coverageLimit = quote?.coverage_limit ?? policy?.coverage_limit ?? 0;

  return (
    <div className="space-y-8 max-w-[1280px] mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Coverage Profile
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            Parametric policy management · Weekly premium · Coverage limits
          </p>
        </div>
        {policy && (
          <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest shadow-glow-emerald font-mono">
            ACTIVE POLICY
          </span>
        )}
      </div>

      {/* Worker Snapshot */}
      {worker && (
        <SectionCard title="Worker Designation" noPadding>
          <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between bg-gradient-to-r from-[rgba(255,255,255,0.02)] to-transparent">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-2xl font-bold text-gray-200 shadow-glass">
                {worker.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-bold text-white">{worker.name}</h2>
                  <StatusBadge status="active" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-emerald-500/80" />
                    {worker.zones?.name ?? worker.zone_id} · {worker.zones?.city}
                  </span>
                  <span className="flex items-center gap-1.5 border-l border-[rgba(255,255,255,0.1)] pl-4">
                    <Activity size={14} className="text-sky-500/80" />
                    {worker.platform}
                  </span>
                  <span className="border-l border-[rgba(255,255,255,0.1)] pl-4 font-mono text-xs mt-0.5">
                    ID: {worker.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
            <div className="md:border-l border-[rgba(255,255,255,0.08)] md:pl-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                Coverage Status
              </p>
              <StatusBadge status={policy ? "active" : "review"} size="md" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          label="Zone Risk"
          value={zri.toFixed(2)}
          unit="× ZRI"
          sub={`${worker?.zones?.name ?? 'Zone'} · ${worker?.zones?.city}`}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Premium Breakdown */}
        <div className="lg:col-span-8">
          <SectionCard
            title="Premium Formula Analysis"
            badge={quote?.eligibility
              ? <span className="text-xs font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded border border-emerald-400/20 shadow-glow-emerald">ELIGIBLE</span>
              : <span className="text-xs font-bold tracking-widest bg-red-500/10 text-red-400 px-3 py-1 rounded border border-red-400/20 shadow-glow-red">INELIGIBLE</span>
            }
            headerRight={
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="btn-secondary text-xs flex items-center gap-2 px-3 py-1.5"
              >
                {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showBreakdown ? "Hide Details" : "Show Details"}
              </button>
            }
          >
            {showBreakdown && (
              <div className="space-y-2 animate-slide-up">
                {/* Formula explanation */}
                <div className="mb-6 p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <p className="text-sm font-mono text-gray-400 font-semibold mb-1">
                    Premium = BWE × 5% × ZRI × WI × TE × RA
                  </p>
                  <p className="text-xs text-gray-500">
                    All factors are fully deterministic. No black-box machine learning.
                  </p>
                </div>

                <div className="space-y-1">
                  {[
                    { label: "Base Weekly Earnings (BWE)", value: `₹${bwe.toFixed(0)}`, formula: "Median earnings from work history", color: "text-white" },
                    { label: "Base Rate Base", value: "5%", formula: "Fixed parametric baseline", color: "text-gray-300" },
                    { label: "Zone Risk Index (ZRI)", value: `${d?.zone_multiplier?.toFixed(4) ?? zri}×`, formula: `${worker?.zones?.name ?? 'Assigned'} zone risk factor`, color: "text-amber-400" },
                    { label: "Work Intensity Factor (WI)", value: `${d?.work_intensity_factor?.toFixed(4) ?? "—"}×`, formula: "BWE / 5000, clamped 0.8–1.5", color: "text-sky-400" },
                    { label: "Time Exposure Factor (TE)", value: `${d?.time_exposure_factor?.toFixed(4) ?? "—"}×`, formula: "Earnings concentration in risky hours", color: "text-emerald-400" },
                    { label: "Risk Adjustment (RA)", value: `${d?.risk_adjustment?.toFixed(4) ?? "1.0"}×`, formula: "Recent claims anomaly multiplier", color: "text-orange-400" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.01)] px-2 transition-colors rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-300">{row.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.formula}</p>
                      </div>
                      <span className={`text-sm font-mono font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 flex justify-between items-center border-t border-[rgba(255,255,255,0.1)] px-2">
                  <span className="text-sm uppercase tracking-widest text-gray-400 font-bold">Computed Premium</span>
                  <span className="text-3xl font-mono text-white font-black">₹{premium}</span>
                </div>

                {quote?.explanation && (
                  <div className="mt-5 p-4 border-l-2 border-emerald-500/50 bg-emerald-500/5">
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                      {quote.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Policy Action */}
        <div className="lg:col-span-4 space-y-6">
          {policy ? (
            <SectionCard title="Active Contract Details">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contract ID</span>
                  <span className="text-xs font-mono font-bold text-gray-300">{policy.id.split('-')[0]}...</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Weekly Premium</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">₹{policy.weekly_premium}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Coverage Limit</span>
                  <span className="text-sm font-mono font-bold text-sky-400">₹{policy.coverage_limit}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Run-Rate Base</span>
                  <span className="text-sm font-mono font-bold text-gray-200">₹{policy.bwe}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status</span>
                  <StatusBadge status={policy.status === "active" ? "active" : "review"} />
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Activate Coverage">
              <div className="text-center py-6 space-y-6">
                {activated ? (
                  <div className="card border-emerald-500/20 bg-emerald-500/5 shadow-glow-emerald p-6 animate-scale-in">
                    <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
                    <p className="text-lg font-bold text-white">Policy Activated</p>
                    <p className="text-sm text-gray-400 mt-2 font-medium">Your parametric coverage is now live.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-[250px] mx-auto">
                      No active policy detected. Lock in your weekly premium to activate automatic coverage.
                    </p>
                    {quote?.eligibility && (
                      <div className="card p-5 text-left border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Premium Output</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-4xl font-black font-mono text-white">₹{premium}</p>
                          <p className="text-xs font-bold text-gray-600">/ week</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleActivate}
                      disabled={activating || !quote?.eligibility}
                      className="w-full btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                    >
                      {activating ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} className="fill-[#09090b]" />}
                      {activating ? "Initializing Contract..." : "Confirm & Activate"}
                    </button>
                    {!quote?.eligibility && (
                      <p className="text-xs text-red-400/90 font-medium px-4">{quote?.explanation ?? "Requirements not met for coverage."}</p>
                    )}
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {/* Eligibility note */}
          <div className="card p-5 border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Underwriting Rules</p>
            <div className="space-y-4 text-sm font-medium text-gray-400">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${(worker?.id ? true : false) ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-glow-emerald" : "bg-gray-800 border border-gray-700"}`}>
                  {(worker?.id ? true : false) && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>}
                </div>
                Min. 8 weeks history
              </div>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${bwe >= 1500 ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-glow-emerald" : "bg-gray-800 border border-gray-700"}`}>
                  {bwe >= 1500 && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>}
                </div>
                Earnings ≥ ₹1,500/week
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-4 h-4 rounded-full flex flex-shrink-0 items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-glow-emerald">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                </div>
                Active in tracked zone
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
