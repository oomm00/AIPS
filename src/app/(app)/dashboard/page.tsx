"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPin, ArrowRight, Zap, UserPlus,
  FileText, CloudRain, RefreshCw, AlertTriangle, BadgeIndianRupee, ShieldCheck, BarChart3
} from "lucide-react";
import Card from "@/components/Card";
import SectionCard from "@/components/SectionCard";
import SectionHeader from "@/components/SectionHeader";
import StatusBadge from "@/components/StatusBadge";
import KeyMetricCard from "@/components/KeyMetricCard";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import ProgressBar from "@/components/ProgressBar";
import { Timeline, TimelineItem } from "@/components/Timeline";
import {
  fetchWorkers, fetchPolicies, fetchPremiumQuote, fetchAuditLogs,
  SEED_WORKER_ID, type ApiWorker, type ApiPolicy, type ApiPremiumResult, type AuditLogEntry
} from "@/lib/apiClient";

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
        fetchAuditLogs({ worker_id: SEED_WORKER_ID, limit: 6 }),
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

  if (loading) return <LoadingState message="Connecting to AIPS Engine..." />;
  if (error) return <ErrorState message="Connection Lost" detail={error} onRetry={load} />;

  if (!worker) {
    return (
      <div className="max-w-[1280px] mx-auto pt-10">
         <EmptyState
          icon={<UserPlus size={48} />}
          message="Welcome to AIPS"
          sub="No worker profile detected. Get started by registering a worker to view simulations and policies."
          action={
            <Link href="/register" className="btn-primary inline-flex items-center gap-2">
              Register Worker <ArrowRight size={14} />
            </Link>
          }
        />
      </div>
    );
  }

  const premium = policy?.weekly_premium ?? quote?.premium ?? 0;
  const coverage = policy?.coverage_limit ?? quote?.coverage_limit ?? 0;
  const bwe = policy?.bwe ?? quote?.data?.base_weekly_exposure ?? 0;
  const zri = worker?.zones?.zri ?? 1.18;
  const riskRatio = Math.max(0, Math.min(1, zri / 2));
  const riskLabel = zri >= 1.3 ? "High" : zri >= 1.1 ? "Moderate" : "Low";

  const timelineItems: TimelineItem[] = recentLogs.map(log => ({
    id: log.id,
    title: `Engine: ${log.engine_name.toUpperCase()}`,
    description: log.message,
    timestamp: new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    status: log.engine_name === "payout" ? "success" : log.engine_name === "fraud" ? "warning" : "default"
  }));

  return (
    <div className="space-y-8 max-w-[1280px] mx-auto pb-12 animate-fade-in">
      <SectionHeader
        title="AIPS Dashboard"
        subtitle="Real-time insurance analytics for gig workers"
        action={
          <button onClick={load} className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2">
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-glow-sky">
          <p className="text-sm text-gray-400">Worker</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-100">{worker.name}</h3>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-sky-400" />
              {worker.zones?.name ?? worker.zone_id}
            </span>
            <StatusBadge status="active" />
          </div>
        </Card>

        <KeyMetricCard
          label="Active Policy"
          value={policy ? "Live" : "Pending"}
          sub={policy ? `₹${premium}/week premium` : "Generate quote to activate"}
          icon={<ShieldCheck size={18} />}
          accent={policy ? "emerald" : "amber"}
          mono={false}
        />

        <KeyMetricCard
          label="Weekly Earnings"
          value={bwe ? `₹${Math.round(bwe)}` : "—"}
          sub="Base weekly exposure"
          icon={<BadgeIndianRupee size={18} />}
          accent="sky"
        />

        <KeyMetricCard
          label="Risk Level"
          value={riskLabel}
          unit={`${zri.toFixed(2)}x`}
          sub="Zone-adjusted risk"
          icon={<AlertTriangle size={18} />}
          accent={zri >= 1.3 ? "red" : zri >= 1.1 ? "amber" : "emerald"}
          mono={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SectionCard title="Premium Breakdown" subtitle="Deterministic pricing factors" badge={policy ? <StatusBadge status="active" /> : undefined}>
            {quote?.data ? (
              <div className="space-y-4">
                <ProgressBar value={quote.data.zone_multiplier / 2} label={`Zone Multiplier (${quote.data.zone_multiplier.toFixed(2)}x)`} color="amber" size="md" />
                <ProgressBar value={quote.data.work_intensity_factor / 2} label={`Work Intensity (${quote.data.work_intensity_factor.toFixed(2)}x)`} color="sky" size="md" />
                <ProgressBar value={quote.data.time_exposure_factor / 2} label={`Time Exposure (${quote.data.time_exposure_factor.toFixed(2)}x)`} color="emerald" size="md" />
                <ProgressBar value={Math.min(1, quote.data.risk_adjustment)} label={`Risk Adjustment (${quote.data.risk_adjustment.toFixed(2)}x)`} color="red" size="md" />
              </div>
            ) : (
              <EmptyState message="Premium breakdown unavailable" sub="Run a quote to view factorized pricing." action={<Link href="/policy" className="btn-secondary rounded-lg px-4 py-2">Open Policy</Link>} />
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <SectionCard title="Coverage Cap" subtitle="Current policy boundaries">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5" hoverable={false}>
                <p className="text-sm text-gray-400">Weekly Premium</p>
                <p className="mt-1 data-value text-2xl font-semibold text-emerald-300">₹{premium || 0}</p>
              </Card>
              <Card className="p-5" hoverable={false}>
                <p className="text-sm text-gray-400">Coverage Cap</p>
                <p className="mt-1 data-value text-2xl font-semibold text-sky-300">₹{coverage || 0}</p>
              </Card>
            </div>
          </SectionCard>

          <SectionCard title="Zone Risk Indicator" subtitle="Progressive threshold signal">
            <ProgressBar
              value={riskRatio}
              label={`${worker.zones?.name ?? "Assigned Zone"}`}
              valueLabel={`${(riskRatio * 100).toFixed(0)}%`}
              color={zri >= 1.3 ? "red" : zri >= 1.1 ? "amber" : "emerald"}
              size="md"
            />
            <p className="mt-3 text-sm text-gray-400">Risk status: <span className="font-semibold text-gray-100">{riskLabel}</span></p>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SectionCard title="Recent Activity Timeline" subtitle="Latest engine events and audit markers">
            <Timeline items={timelineItems} />
          </SectionCard>
        </div>
        <div className="lg:col-span-4">
          <Card className="p-6 h-full bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-400/20">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-300">
                  <Zap size={20} />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-gray-100">Run Simulation</h3>
                <p className="mt-2 text-sm text-gray-400">Launch the live pipeline to evaluate payout, fraud, and attribution in one flow.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/simulate" className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm">
                  <CloudRain size={14} />
                  Start
                </Link>
                <Link href="/policy" className="btn-secondary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm">
                  <FileText size={14} />
                  Policy
                </Link>
              </div>
              <Link href="/audit" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-gray-100">
                View full audit trail <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-right">
        <Link href="/simulate" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100">
          Explore full simulation flow <BarChart3 size={14} />
        </Link>
      </div>
    </div>
  );
}
