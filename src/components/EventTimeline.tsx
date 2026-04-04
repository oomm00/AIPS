"use client";

import { CloudRain, WifiOff, Thermometer, ShieldAlert, Wind } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { TriggerEvent } from "@/lib/mockData";

interface EventTimelineProps {
  events: TriggerEvent[];
}

const typeConfig: Record<string, { icon: typeof CloudRain; label: string; accent: string }> = {
  rain: { icon: CloudRain, label: "Heavy Rain", accent: "text-sky-400" },
  shutdown: { icon: WifiOff, label: "Internet Shutdown", accent: "text-violet-400" },
  heat: { icon: Thermometer, label: "Extreme Heat", accent: "text-orange-400" },
  curfew: { icon: ShieldAlert, label: "Curfew / Closure", accent: "text-rose-400" },
  aqi: { icon: Wind, label: "Severe AQI", accent: "text-amber-400" },
};

export default function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="relative">
      {/* Dashed connector line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-px border-l border-dashed border-zinc-800" />

      <div className="space-y-1">
        {events.map((event, i) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;

          return (
            <div
              key={event.id}
              className="relative flex gap-4 p-3 rounded-md hover:bg-white/[0.02] transition-colors group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                <div className={`w-[38px] h-[38px] rounded-md flex items-center justify-center bg-white/[0.03] border border-zinc-800/60 group-hover:border-zinc-700/60 transition-colors`}>
                  <Icon size={16} className={config.accent} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-200">
                      {config.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {event.date} · {event.time} · {event.duration}
                    </p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>

                {/* Data row */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px] text-zinc-500">
                    Index: <span className="data-value text-zinc-300">{event.indexValue}{event.indexUnit}</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    TCS: <span className="data-value text-zinc-300">{event.tcs.toFixed(2)}</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    US: <span className="data-value text-zinc-300">{event.us.toFixed(2)}</span>
                  </span>
                  {event.payoutAmount && (
                    <span className="text-[11px] text-emerald-500 font-mono font-medium">
                      ₹{event.payoutAmount.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {event.statusReason && (
                  <p className="text-[10px] text-zinc-600 mt-1.5 italic">
                    {event.statusReason}
                  </p>
                )}

                {event.peakOverlap && event.status === "paid" && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/8 text-amber-500 text-[10px] font-medium">
                    +₹150 Incentive Delta · Peak window
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
