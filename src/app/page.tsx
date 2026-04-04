import Link from "next/link";
import { ArrowRight, Shield, Zap, Database, Scale } from "lucide-react";
import { statStrip } from "@/lib/mockData";

const statIcons = [Zap, Zap, Database, Scale];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 h-16 border-b border-zinc-800/30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold font-mono">A</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tighter text-zinc-100">AIPS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="btn-secondary text-xs"
          >
            Open Dashboard
          </Link>
          <Link
            href="/simulate"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            Run Simulation
            <ArrowRight size={12} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 pt-24 pb-20">
        {/* Tagline chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-zinc-800/50 mb-8">
          <Shield size={12} className="text-emerald-500" />
          <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
            Guidewire DEVTrails 2026 · Parametric Microinsurance
          </span>
        </div>

        {/* Main heading — command-line style */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tightest leading-[1.05] text-white mb-6">
          Income protection<br />
          for the <span className="text-emerald-400">10-minute</span><br />
          economy.
        </h1>

        <p className="text-base md:text-lg text-zinc-500 max-w-xl leading-relaxed mb-4">
          When a storm shuts your zone for 5 hours, you lose ₹700.
          AIPS watches the data, confirms the disruption, and sends money
          to your UPI. No forms. No call center. Under 2 hours.
        </p>

        <p className="text-sm text-zinc-600 font-mono mb-10">
          Built for Zepto and Blinkit delivery partners.
        </p>

        {/* CTA row */}
        <div className="flex items-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
          >
            Enter Dashboard
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/simulate"
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            Simulation Lab
          </Link>
        </div>

        {/* Terminal preview */}
        <div className="inset-terminal max-w-2xl">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] text-zinc-600 ml-2">aips — trigger pipeline</span>
          </div>
          <div className="p-4 space-y-1 text-[12px] leading-relaxed">
            <p><span className="text-zinc-600">$</span> <span className="text-zinc-400">aips trigger --zone HSR-BLR-07 --type rain</span></p>
            <p className="text-sky-400">  [INGEST]  IoT sensor: 7.4mm/hr | OpenWeather: 6.9mm/hr</p>
            <p className="text-violet-400">  [NORMALIZE]  Rain signal → 1.00, 0.90, 0.70</p>
            <p className="text-amber-400">  [TCS]  Trigger Confidence Score = 0.88</p>
            <p className="text-emerald-400">  [DECISION]  AUTO_APPROVE (TCS &gt; 0.75, US &lt; 0.30)</p>
            <p className="text-emerald-500">  [PAYOUT]  ₹636 → UPI settlement initiated</p>
            <p className="text-zinc-600">  [AUDIT]  Evidence bundle written. Immutable.</p>
          </div>
        </div>
      </section>

      {/* Stat Strip */}
      <section className="relative z-10 border-t border-zinc-800/30">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800/30">
            {statStrip.map((stat, i) => {
              const Icon = statIcons[i];
              return (
                <div key={stat.label} className="py-6 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} className="text-zinc-600" />
                    <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
                      {stat.label}
                    </p>
                  </div>
                  <p className="data-value text-lg font-semibold text-white">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {stat.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture strip */}
      <section className="relative z-10 border-t border-zinc-800/30 py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-6">
            Pipeline Architecture
          </p>
          <div className="flex items-center gap-0 flex-wrap">
            {["Trigger Engine", "Attribution Engine", "Fraud Engine", "Payout Engine"].map((engine, i) => (
              <div key={engine} className="flex items-center">
                <div className="card px-4 py-3">
                  <p className="text-[12px] font-medium text-zinc-300 font-mono">{engine}</p>
                </div>
                {i < 3 && (
                  <div className="px-2">
                    <ArrowRight size={12} className="text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/30 py-6 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-[10px] text-zinc-700 font-mono">
            AIPS v0.1.0 · Guidewire DEVTrails 2026
          </p>
          <p className="text-[10px] text-zinc-700">
            Because the worker who delivered your groceries in the rain deserves a safety net.
          </p>
        </div>
      </footer>
    </div>
  );
}
