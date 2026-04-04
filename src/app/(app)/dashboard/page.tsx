"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPin, Activity, ShieldCheck, ArrowRight, Zap, UserPlus,
  FileText, ClipboardList, CloudRain, RefreshCw, DollarSign,
  CheckCircle2, AlertTriangle
} from "lucide-react";
import SectionCard from "@/components/SectionCard";
import StatusBadge from "@/components/StatusBadge";
import KeyMetricCard from "@/components/KeyMetricCard";
import { LoadingState, ErrorState } from "@/components/States";
import ProgressBar from "@/components/ProgressBar";
import {
  fetchWorkers, fetchPolicies, fetchPremiumQuote, fetchAuditLogs,
  SEED_WORKER_ID, type ApiWorker, type ApiPolicy, type ApiPremiumResult, type AuditLogEntry
} from "@/lib/apiClient";

const engineBadge: Record<string, string> = {
  trigger:     "text-sky-400 bg-sky-400/10 border-sky-400/20",
  attribution: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  fraud:       "text-red-400 bg-red-400/10 border-red-400/20",
  payout:      "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  orchestrator:"text-amber-400 bg-amber-400/10 border-amber-400/20",
};

export default function DashboardPage() {
  const [worker, setWorker] = useState<ApiWorker | null>(null);
  const [policy, setPolicy] = useState<ApiPolicy | null>(null);
  const [quote, setQuote] = useState<ApiPremiumResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [workers, policies, premiumRes, auditRes] = await Promise.all([
        fetchWorkers(),
        fetchPolicies(SEED_WORKER_ID),
        fetchPremiumQuote(SEED_WORKER_ID),
        fetchAuditLogs({ worker_id: SEED_WORKER_ID, limit: 8 }),
      ]);
      setWorker(workers.find((w) => w.id === SEED_WORKER_ID) ?? workers[0] ?? null);
      setPolicy(policies.find((p) => p.status === "active") ?? policies[0] ?? null);
      setQuote(premiumRes);
      setRecentLogs(auditRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message="Dashboard load failed" detail={error} onRetry={load} />;

  const premium = policy?.weekly_premium ?? quote?.premium ?? 0;
  const coverage = policy?.coverage_limit ?? quote?.coverage_limit ?? 0;
  const bwe = policy?.bwe ?? quote?.data?.base_weekly_exposure ?? 0;
  const zri = worker?.zones?.zri ?? 1.18;

  // Find latest payout log
  const latestPayout = recentLogs.find((l) => l.engine_name === "payout");
  const latestTrigger = recentLogs.find((l) => l.engine_name === "trigger");

  return (
    <div className="space-y-5 max-w-[1280px] mx-auto pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-zinc-800/50">
        {worker ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-md bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-2xl font-semibold text-zinc-300 font-mono">
              {worker.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{worker.name}</h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PROTECTED
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-zinc-500" />
                  {worker.zones?.name ?? worker.zone_id.substring(0, 8)} · {worker.zones?.city}
                </span>
                <span className="text-zinc-700">|</span>
                <span>{worker.platform}</span>
                <span className="text-zinc-700">|</span>
                <span>{worker.vehicle_type}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="text-[12px] text-zinc-500 mt-1">No worker found. Register one to get started.</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-secondary text-[11px] flex items-center gap-1.5">
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KeyMetricCard
          label="Weekly Premium"
          value={premium ? `₹${premium}` : "—"}
          sub={policy ? "Active policy" : "No active policy"}
          accent={policy ? "emerald" : "zinc"}
        />
        <KeyMetricCard
          label="Coverage Cap"
          value={coverage ? `₹${coverage}` : "—"}
          sub="Maximum weekly payout"
          accent="sky"
        />
        <KeyMetricCard
          label="Zone Risk Index"
          value={zri.toFixed(2)}
          unit="× ZRI"
          sub={worker?.zones?.name ?? "—"}
          accent="amber"
        />
        <KeyMetricCard
          label="Base Weekly Earning"
          value={bwe ? `₹${bwe.toFixed(0)}` : "—"}
          sub="Historical median"
          accent="zinc"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-5">

          {/* Policy Panel */}
          <SectionCard
            title="Active Policy"
            badge={policy
              ? <StatusBadge status="active" />
              : <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">NO POLICY</span>
            }
            headerRight={
              <Link href="/policy" className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                Manage <ArrowRight size={10} />
              </Link>
            }
            className={policy ? "border-emerald-500/10" : "border-amber-500/10"}
          >
            {policy ? (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Weekly Premium</p>
                    <p className="data-value text-2xl font-semibold text-white">₹{policy.weekly_premium}</p>
                  </div>
                  <div className="border-l border-zinc-800/50 pl-4">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Coverage Cap</p>
                    <p className="data-value text-2xl font-semibold text-white">₹{policy.coverage_limit}</p>
                  </div>
                  <div className="border-l border-zinc-800/50 pl-4">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">BWE (Base)</p>
                    <p className="data-value text-2xl font-semibold text-white">₹{policy.bwe}</p>
                  </div>
                </div>
                {quote?.data && (
                  <div className="pt-3 border-t border-zinc-800/40">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">Risk Factors</p>
                    <div className="space-y-2.5">
                      <ProgressBar value={quote.data.zone_multiplier / 2} label={`Zone Multiplier (ZRI: ${quote.data.zone_multiplier.toFixed(2)})`} color="amber" size="sm" />
                      <ProgressBar value={quote.data.work_intensity_factor / 2} label={`Work Intensity (${quote.data.work_intensity_factor.toFixed(2)}×)`} color="sky" size="sm" />
                      <ProgressBar value={quote.data.time_exposure_factor / 2} label={`Time Exposure (${quote.data.time_exposure_factor.toFixed(2)}×)`} color="emerald" size="sm" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertTriangle size={24} className="text-amber-400 mx-auto mb-3" />
                <p className="text-[13px] text-zinc-400">No active policy found</p>
                <Link href="/policy" className="btn-primary text-[12px] mt-4 inline-flex items-center gap-2">
                  <FileText size={13} />
                  Set Up Policy →
                </Link>
              </div>
            )}
          </SectionCard>

          {/* Recent Audit Trail */}
          <SectionCard
            title="Recent Engine Activity"
            subtitle="Latest audit log entries from engine runs"
            headerRight={
              <Link href="/audit" className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                View All <ArrowRight size={10} />
              </Link>
            }
          >
            {recentLogs.length === 0 ? (
              <p className="text-[12px] text-zinc-600 py-4 text-center">
                No simulations run yet.{" "}
                <Link href="/simulate" className="text-emerald-400 hover:underline">Run one now →</Link>
              </p>
            ) : (
              <div className="space-y-1">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800/30 last:border-0">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${engineBadge[log.engine_name] ?? "text-zinc-400 border-zinc-800"}`}>
                      {log.engine_name}
                    </span>
                    <p className="text-[11px] font-mono text-zinc-300 font-medium">{log.decision}</p>
                    <p className="text-[10px] text-zinc-600 flex-1 truncate">{log.message.substring(0, 55)}…</p>
                    <span className="text-[9px] font-mono text-zinc-700 flex-shrink-0">
                      {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Actions */}
          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/simulate", icon: CloudRain, label: "Simulate Rain", desc: "Run disruption", color: "sky" },
                { href: "/policy",   icon: FileText,   label: "Manage Policy", desc: "View premium",  color: "emerald" },
                { href: "/register", icon: UserPlus,   label: "Register",      desc: "Add worker",    color: "violet" },
                { href: "/audit",    icon: ClipboardList, label: "Audit Trail", desc: "View logs",   color: "amber" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="card p-3.5 hover:border-zinc-700 transition-all group flex flex-col gap-2"
                  >
                    <Icon size={16} className={`text-${action.color}-400 group-hover:scale-110 transition-transform`} />
                    <div>
                      <p className="text-[12px] font-semibold text-zinc-200">{action.label}</p>
                      <p className="text-[10px] text-zinc-600">{action.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          {/* Latest Simulation Result */}
          {latestTrigger && (
            <SectionCard title="Latest Simulation" badge={<span className="text-[9px] font-mono text-zinc-600">{latestTrigger.simulation_id.substring(0, 8)}…</span>}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {latestTrigger.decision.includes("APPROVE") ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-400" />
                  )}
                  <span className="text-[13px] font-mono font-semibold text-zinc-200">
                    {latestTrigger.decision}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{latestTrigger.message}</p>
                {latestPayout && (
                  <div className="card p-3 mt-2">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Last Payout</p>
                    <p className="text-[11px] font-mono text-zinc-400">{latestPayout.decision}</p>
                  </div>
                )}
                <Link
                  href={`/audit?simulation_id=${latestTrigger.simulation_id}`}
                  className="btn-secondary text-[11px] flex items-center gap-1.5 w-fit"
                >
                  <ArrowRight size={11} />
                  View Full Trace
                </Link>
              </div>
            </SectionCard>
          )}

          {/* System Status */}
          <SectionCard title="System Status">
            <div className="space-y-2">
              {[
                { label: "Trigger Engine",     status: "ONLINE", ok: true },
                { label: "Attribution Engine", status: "ONLINE", ok: true },
                { label: "Fraud Engine",       status: "ONLINE", ok: true },
                { label: "Payout Engine",      status: "ONLINE", ok: true },
                { label: "Supabase DB",        status: "CONNECTED", ok: true },
              ].map((sys) => (
                <div key={sys.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${sys.ok ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[12px] text-zinc-400">{sys.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${sys.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
