"use client";

import { useState, useCallback } from "react";
import { UserPlus, CheckCircle2, MapPin, Truck, Building2, RefreshCw } from "lucide-react";
import Link from "next/link";
import SectionCard from "@/components/SectionCard";
import { createWorker, type ApiWorker } from "@/lib/apiClient";

const PLATFORMS = ["Zepto", "Blinkit", "Swiggy Instamart", "BB Now", "Dunzo"];
const VEHICLES  = ["Two Wheeler", "Three Wheeler", "Bicycle", "On Foot"];
const ZONES = [
  { id: "ebb7cde9-79ad-4bc6-848e-f495e8ebcbee", label: "HSR Layout, Bangalore", zri: 1.18 },
  // Additional zones would come from API in production
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Zepto");
  const [zoneId, setZoneId] = useState(ZONES[0].id);
  const [vehicle, setVehicle] = useState("Two Wheeler");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<ApiWorker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const worker = await createWorker({
        name: name.trim(),
        platform,
        zone_id: zoneId,
        vehicle_type: vehicle,
      });
      setCreated(worker);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }, [name, platform, zoneId, vehicle, submitting]);

  if (created) {
    return (
      <div className="max-w-[600px] mx-auto pt-10 pb-20">
        <div className="card p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Registration Complete!</h2>
          <p className="text-zinc-500 text-[13px]">
            Worker <strong className="text-zinc-200">{created.name}</strong> has been registered on the AIPS platform.
          </p>

          <div className="text-left card p-4 space-y-2 bg-zinc-900/50">
            <div className="flex justify-between text-[12px]">
              <span className="text-zinc-500">Worker ID</span>
              <span className="font-mono text-zinc-200">{created.id}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-zinc-500">Platform</span>
              <span className="text-zinc-200">{created.platform}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-zinc-500">Vehicle</span>
              <span className="text-zinc-200">{created.vehicle_type}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-zinc-500">Zone ID</span>
              <span className="font-mono text-zinc-400">{created.zone_id.substring(0, 16)}…</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-600">
            Complete 8 weeks of work history before requesting a premium quote.
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <Link href="/policy" className="btn-primary text-[12px]">
              Set Up Policy →
            </Link>
            <button
              onClick={() => { setCreated(null); setName(""); }}
              className="btn-secondary text-[12px]"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto pb-10">
      <div className="pb-4 mb-6 border-b border-zinc-800/50">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <UserPlus size={22} className="text-emerald-400" />
          Register Worker
        </h1>
        <p className="text-[12px] text-zinc-500 mt-1">
          Onboard a gig worker onto the AIPS income protection platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <SectionCard title="Worker Details">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajan Kumar"
                required
                className="w-full bg-zinc-900 border border-zinc-800 text-[13px] text-zinc-200 rounded-md px-3 py-2.5 focus:outline-none focus:border-zinc-600 placeholder-zinc-700"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
                <Building2 size={10} className="inline mr-1" />
                Platform
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`py-2 text-[11px] rounded-md border transition-colors ${
                      platform === p
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
                <MapPin size={10} className="inline mr-1" />
                Zone
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-300 rounded-md px-3 py-2.5 focus:outline-none focus:border-zinc-600"
              >
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label} (ZRI: {z.zri})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">
                <Truck size={10} className="inline mr-1" />
                Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVehicle(v)}
                    className={`py-2 text-[11px] rounded-md border transition-colors ${
                      vehicle === v
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {submitting ? "Registering..." : "Register Worker"}
            </button>
          </form>
        </SectionCard>

        {/* Info panel */}
        <div className="space-y-4">
          <SectionCard title="Eligibility Requirements">
            <div className="space-y-3 text-[12px]">
              {[
                { label: "Work History", desc: "Minimum 8 weeks of recorded earnings data", met: false },
                { label: "Income Threshold", desc: "Median daily earnings ≥ ₹1,500", met: false },
                { label: "Zone Verification", desc: "Must operate in AIPS-registered zone", met: !!zoneId },
                { label: "Platform Enrollment", desc: "Partner platform must be onboarded", met: true },
              ].map((req) => (
                <div key={req.label} className="flex items-start gap-3 py-2 border-b border-zinc-800/40 last:border-0">
                  <span className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${req.met ? "bg-emerald-500/60" : "bg-zinc-700"}`} />
                  <div>
                    <p className="text-zinc-300 font-medium">{req.label}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{req.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="How AIPS Works">
            <div className="space-y-3 text-[11px] text-zinc-500 leading-relaxed">
              <p>
                <span className="text-zinc-200 font-medium">1. Register</span> → Worker is enrolled in the database with zone and platform context.
              </p>
              <p>
                <span className="text-zinc-200 font-medium">2. Policy</span> → Premium is computed using the parametric formula based on earnings history and zone risk.
              </p>
              <p>
                <span className="text-zinc-200 font-medium">3. Trigger</span> → A disruption event (rain, shutdown, zone closure) is detected and scored.
              </p>
              <p>
                <span className="text-zinc-200 font-medium">4. Payout</span> → If verified, payout is automatically calculated and disbursed. No claims form.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
