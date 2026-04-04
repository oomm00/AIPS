"use client";

interface KeyMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: "emerald" | "amber" | "red" | "sky" | "zinc";
  mono?: boolean;
}

const accentMap: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  sky: "text-sky-400",
  zinc: "text-zinc-200",
};

export default function KeyMetricCard({
  label,
  value,
  unit,
  sub,
  accent = "zinc",
  mono = true,
}: KeyMetricCardProps) {
  const color = accentMap[accent];
  return (
    <div className="card p-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className={`text-2xl font-semibold ${color} ${mono ? "font-mono data-value" : ""}`}>
          {value}
        </p>
        {unit && <span className="text-zinc-500 text-xs">{unit}</span>}
      </div>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}
