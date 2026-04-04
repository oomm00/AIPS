"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, RefreshCw, ClipboardList } from "lucide-react";
import SectionCard from "@/components/SectionCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import JsonViewer from "@/components/JsonViewer";
import { fetchAuditLogs, SEED_WORKER_ID, type AuditLogEntry } from "@/lib/apiClient";

const ENGINE_FILTERS = ["all", "trigger", "attribution", "fraud", "payout", "orchestrator"];

const engineColors: Record<string, string> = {
  trigger: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  attribution: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  fraud: "text-red-400 bg-red-400/10 border-red-400/20",
  payout: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  orchestrator: "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

const decisionColors: Record<string, string> = {
  AUTO_APPROVE: "text-emerald-400",
  AUTO_APPROVE_LOW_CONFIDENCE: "text-sky-400",
  MANUAL_REVIEW: "text-amber-400",
  REJECT: "text-red-400",
  STRONG: "text-emerald-400",
  PARTIAL: "text-sky-400",
  WEAK: "text-zinc-400",
  LOW_RISK: "text-emerald-400",
  MEDIUM_RISK: "text-amber-400",
  HIGH_RISK: "text-orange-400",
  CRITICAL_RISK: "text-red-400",
  STANDARD_PAYOUT: "text-emerald-400",
  CAPPED_PAYOUT: "text-amber-400",
  FAILURE: "text-red-400",
  INELIGIBLE: "text-red-400",
  ACTIVE: "text-emerald-400",
};

function getDecisionColor(decision: string): string {
  return decisionColors[decision] ?? "text-zinc-300";
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const engineStyle = engineColors[log.engine_name] ?? "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  const decisionColor = getDecisionColor(log.decision);
  const ts = new Date(log.created_at).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <>
      <tr
        className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-3 px-4 text-[11px] font-mono text-zinc-600">{log.id.substring(0, 8)}…</td>
        <td className="py-3 px-4">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${engineStyle}`}>
            {log.engine_name}
          </span>
        </td>
        <td className={`py-3 px-4 text-[11px] font-mono font-medium ${decisionColor}`}>
          {log.decision}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/60 rounded-full"
                style={{ width: `${Math.round(log.confidence * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {(log.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </td>
        <td className="py-3 px-4 text-[10px] text-zinc-500 max-w-[280px] truncate font-mono">
          {log.message}
        </td>
        <td className="py-3 px-4 text-[10px] text-zinc-600 font-mono whitespace-nowrap">{ts}</td>
        <td className="py-3 px-4 text-zinc-600">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </td>
      </tr>
      {expanded && log.metadata_json && (
        <tr className="border-b border-zinc-800/40">
          <td colSpan={7} className="px-4 pb-4 pt-2">
            <div className="rounded-md overflow-hidden">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1.5">
                metadata_json
              </p>
              <JsonViewer data={log.metadata_json} maxHeight="200px" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditPage() {
  const [simId, setSimId] = useState("");
  const [workerId, setWorkerId] = useState(SEED_WORKER_ID);
  const [engineFilter, setEngineFilter] = useState("all");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (page = 1) => {
    if (!simId && !workerId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAuditLogs({
        simulation_id: simId || undefined,
        worker_id: simId ? undefined : workerId,
        engine_name: engineFilter !== "all" ? engineFilter : undefined,
        page,
        limit: 20,
      });
      setLogs(result.data ?? []);
      setPagination(result.pagination ?? { page: 1, total: 0, pages: 0 });
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto pb-10">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-800/50">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ClipboardList size={22} className="text-zinc-500" />
          Audit Trail
        </h1>
        <p className="text-[12px] text-zinc-500 mt-1">
          Immutable ledger of all engine decisions, sorted newest-first
        </p>
      </div>

      {/* Search Controls */}
      <SectionCard title="Search Filters">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5 block">
              Simulation ID
            </label>
            <input
              type="text"
              value={simId}
              onChange={(e) => { setSimId(e.target.value); if (e.target.value) setWorkerId(""); }}
              placeholder="UUID of a simulation event"
              className="w-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:border-zinc-600 placeholder-zinc-700 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5 block">
              Worker ID
            </label>
            <input
              type="text"
              value={workerId}
              onChange={(e) => { setWorkerId(e.target.value); if (e.target.value) setSimId(""); }}
              placeholder="Worker UUID"
              className="w-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:border-zinc-600 placeholder-zinc-700 font-mono"
            />
          </div>
          <div className="sm:w-44">
            <label className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5 block">
              <Filter size={9} className="inline mr-1" />
              Engine
            </label>
            <select
              value={engineFilter}
              onChange={(e) => setEngineFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:border-zinc-600"
            >
              {ENGINE_FILTERS.map((f) => (
                <option key={f} value={f}>{f === "all" ? "All Engines" : f}</option>
              ))}
            </select>
          </div>
          <div className="sm:self-end">
            <button
              onClick={() => handleSearch(1)}
              disabled={loading || (!simId && !workerId)}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 h-[37px] px-5"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              Search
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Results */}
      {loading && <LoadingState message="Fetching audit logs..." />}
      {error && <ErrorState message="Failed to fetch audit logs" detail={error} onRetry={() => handleSearch(1)} />}

      {!loading && searched && logs.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={32} />}
          message="No audit logs found"
          sub="Try a different simulation ID or worker ID"
        />
      )}

      {!loading && logs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50">
            <p className="text-[12px] font-medium text-zinc-300">
              {pagination.total} log{pagination.total !== 1 ? "s" : ""} found
            </p>
            <p className="text-[11px] font-mono text-zinc-600">
              Page {pagination.page} / {pagination.pages}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  {["Log ID", "Engine", "Decision", "Confidence", "Message", "Timestamp", ""].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => <AuditRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-800/50">
              <button
                onClick={() => handleSearch(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn-secondary text-[11px] disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-[11px] text-zinc-600 font-mono">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => handleSearch(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary text-[11px] disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
