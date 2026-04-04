"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Settings2, Users, FileText, Activity, RefreshCw, ArrowRight, ShieldAlert, Zap } from "lucide-react";
import SectionCard from "@/components/SectionCard";
import StatusBadge from "@/components/StatusBadge";
import { LoadingState, ErrorState } from "@/components/States";
import {
  fetchWorkers, fetchPolicies, fetchAuditLogs,
  SEED_WORKER_ID, type ApiWorker, type ApiPolicy, type AuditLogEntry
} from "@/lib/apiClient";

export default function AdminPage() {
  const [workers, setWorkers] = useState<ApiWorker[]>([]);
  const [policies, setPolicies] = useState<ApiPolicy[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ws, ps, auditRes] = await Promise.all([
        fetchWorkers(),
        fetchPolicies(SEED_WORKER_ID),
        fetchAuditLogs({ worker_id: SEED_WORKER_ID, limit: 10 }),
      ]);
      setWorkers(ws);
      setPolicies(ps);
      setRecentLogs(auditRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activePolicy = policies.find((p) => p.status === "active");
  const worker = workers.find((w) => w.id === SEED_WORKER_ID) ?? workers[0];
  const totalSimulations = recentLogs.filter((l) => l.engine_name === "trigger").length;

  const decisionCounts = recentLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.decision] = (acc[log.decision] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) return <LoadingState message="Loading system overview..." />;
  if (error) return <ErrorState message="Failed to load admin dashboard" detail={error} onRetry={load} />;

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Settings2 size={22} className="text-zinc-500" />
            System Admin
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Registered workers · Active policies · Engine activity
          </p>
        </div>
        <button
          onClick={load}
          className="btn-secondary text-[11px] flex items-center gap-1.5"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Registered Workers", value: workers.length, icon: Users, accent: "emerald" },
          { label: "Active Policies", value: policies.filter((p) => p.status === "active").length, icon: FileText, accent: "sky" },
          { label: "Total Policies", value: policies.length, icon: ShieldAlert, accent: "amber" },
          { label: "Audit Log Entries", value: recentLogs.length, icon: Activity, accent: "violet" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">{stat.label}</p>
              <stat.icon size={14} className="text-zinc-600" />
            </div>
            <p className={`text-3xl font-bold font-mono ${
              stat.accent === "emerald" ? "text-emerald-400" :
              stat.accent === "sky" ? "text-sky-400" :
              stat.accent === "amber" ? "text-amber-400" :
              "text-violet-400"
            }`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Workers Table */}
        <div className="lg:col-span-7 space-y-4">
          <SectionCard
            title="Registered Workers"
            badge={<span className="text-[10px] text-zinc-500 font-mono">{workers.length} total</span>}
          >
            {workers.length === 0 ? (
              <p className="text-[12px] text-zinc-600 text-center py-6">No workers registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/40">
                      {["Worker", "Platform", "Zone", "Vehicle"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((w) => (
                      <tr key={w.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/10">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-mono text-zinc-400">
                              {w.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-zinc-200">{w.name}</p>
                              <p className="text-[10px] font-mono text-zinc-600">{w.id.substring(0, 8)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-zinc-400">{w.platform}</td>
                        <td className="py-3 px-3 text-[11px] text-zinc-400">
                          {w.zones?.name ?? w.zone_id.substring(0, 8)}
                          {w.zones && <span className="text-zinc-600 ml-1">· {w.zones.zri}x</span>}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-zinc-400">{w.vehicle_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-zinc-800/40">
              <Link href="/register" className="btn-secondary text-[11px] flex items-center gap-1.5 w-fit">
                <Users size={11} />
                Register New Worker
              </Link>
            </div>
          </SectionCard>

          {/* Policies Table */}
          <SectionCard
            title="Policies"
            badge={<span className="text-[10px] text-zinc-500 font-mono">{policies.length} total</span>}
          >
            {policies.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[12px] text-zinc-600">No policies found.</p>
                <Link href="/policy" className="btn-secondary text-[11px] mt-3 inline-flex items-center gap-1.5">
                  Create Policy →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/40">
                      {["ID", "Premium", "Limit", "BWE", "Status"].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/10">
                        <td className="py-3 px-3 text-[10px] font-mono text-zinc-600">{p.id.substring(0, 8)}…</td>
                        <td className="py-3 px-3 text-[12px] font-mono text-emerald-400">₹{p.weekly_premium}</td>
                        <td className="py-3 px-3 text-[12px] font-mono text-sky-400">₹{p.coverage_limit}</td>
                        <td className="py-3 px-3 text-[11px] font-mono text-zinc-400">₹{p.bwe}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={p.status === "active" ? "active" : "review"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Worker Detail + Recent Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Worker Context */}
          {worker && (
            <SectionCard title="Active Worker Context">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono font-semibold">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-200">{worker.name}</p>
                    <p className="text-[11px] font-mono text-zinc-500">{worker.platform}</p>
                  </div>
                  <StatusBadge status="active" />
                </div>
                {activePolicy && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/40">
                    <div className="card p-3">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Premium</p>
                      <p className="text-[14px] font-mono text-emerald-400 mt-0.5">₹{activePolicy.weekly_premium}</p>
                    </div>
                    <div className="card p-3">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Cap</p>
                      <p className="text-[14px] font-mono text-sky-400 mt-0.5">₹{activePolicy.coverage_limit}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap pt-1">
                  <Link href="/simulate" className="btn-primary text-[11px] flex items-center gap-1.5">
                    <Zap size={11} />
                    Run Simulation
                  </Link>
                  <Link href="/policy" className="btn-secondary text-[11px]">
                    View Policy
                  </Link>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Engine Decision Summary */}
          {Object.keys(decisionCounts).length > 0 && (
            <SectionCard title="Decision Summary">
              <div className="space-y-1.5">
                {Object.entries(decisionCounts).map(([decision, count]) => (
                  <div key={decision} className="flex justify-between items-center py-1.5 border-b border-zinc-800/30 last:border-0">
                    <span className="text-[11px] font-mono text-zinc-400">{decision}</span>
                    <span className="text-[11px] font-mono text-zinc-300 font-medium">{count}×</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Recent Audit Entries */}
          <SectionCard
            title="Recent Audit Entries"
            headerRight={
              <Link href="/audit" className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                View All <ArrowRight size={10} />
              </Link>
            }
          >
            {recentLogs.length === 0 ? (
              <p className="text-[12px] text-zinc-600 py-4 text-center">No audit logs yet.</p>
            ) : (
              <div className="space-y-1">
                {recentLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 py-2 border-b border-zinc-800/30 last:border-0">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                      log.engine_name === "trigger" ? "text-sky-400 border-sky-400/20 bg-sky-400/10" :
                      log.engine_name === "fraud" ? "text-red-400 border-red-400/20 bg-red-400/10" :
                      log.engine_name === "payout" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" :
                      "text-violet-400 border-violet-400/20 bg-violet-400/10"
                    }`}>
                      {log.engine_name}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono text-zinc-300 truncate">{log.decision}</p>
                      <p className="text-[10px] text-zinc-600 truncate mt-0.5">{log.message.substring(0, 60)}…</p>
                    </div>
                    <span className="text-[9px] text-zinc-700 font-mono flex-shrink-0">
                      {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
