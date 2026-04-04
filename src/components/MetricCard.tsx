"use client";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "flat";
  accent?: "emerald" | "amber" | "zinc" | "red";
}

const sparklinePaths: Record<string, string> = {
  up: "M0,20 L8,18 L16,15 L24,16 L32,12 L40,10 L48,6 L56,3",
  down: "M0,5 L8,8 L16,10 L24,9 L32,14 L40,16 L48,18 L56,20",
  flat: "M0,12 L8,11 L16,13 L24,12 L32,11 L40,13 L48,12 L56,11",
};

const accentColors: Record<string, { stroke: string; text: string; glow: string }> = {
  emerald: { stroke: "#10b981", text: "text-emerald-500", glow: "rgba(16,185,129,0.08)" },
  amber: { stroke: "#f59e0b", text: "text-amber-500", glow: "rgba(245,158,11,0.08)" },
  zinc: { stroke: "#71717a", text: "text-zinc-400", glow: "rgba(113,113,122,0.06)" },
  red: { stroke: "#ef4444", text: "text-red-500", glow: "rgba(239,68,68,0.08)" },
};

export default function MetricCard({
  label,
  value,
  detail,
  trend = "flat",
  accent = "zinc",
}: MetricCardProps) {
  const colors = accentColors[accent];

  return (
    <div className="card p-4 relative overflow-hidden group">
      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${colors.glow}, transparent 70%)` }}
      />

      <div className="relative z-10">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">
          {label}
        </p>
        <div className="flex items-end justify-between gap-3">
          <p className="data-value text-2xl font-semibold text-white leading-none">
            {value}
          </p>
          <svg
            width="56"
            height="24"
            viewBox="0 0 56 24"
            fill="none"
            className="opacity-40 group-hover:opacity-70 transition-opacity"
          >
            <path
              d={sparklinePaths[trend]}
              stroke={colors.stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {detail && (
          <p className="text-[11px] text-zinc-500 mt-2 font-mono">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}
