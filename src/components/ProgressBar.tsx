"use client";

interface ProgressBarProps {
  value: number; // 0.0 to 1.0
  label?: string;
  valueLabel?: string;
  color?: "emerald" | "amber" | "red" | "sky" | "zinc";
  size?: "sm" | "md";
  showPercentage?: boolean;
}

const colorMap = {
  emerald: {
    bar: "bg-emerald-500/60",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    text: "text-emerald-400",
  },
  amber: {
    bar: "bg-amber-500/60",
    glow: "shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    text: "text-amber-400",
  },
  red: {
    bar: "bg-red-500/60",
    glow: "shadow-[0_0_8px_rgba(239,68,68,0.15)]",
    text: "text-red-400",
  },
  sky: {
    bar: "bg-sky-500/60",
    glow: "shadow-[0_0_8px_rgba(14,165,233,0.15)]",
    text: "text-sky-400",
  },
  zinc: {
    bar: "bg-zinc-500/40",
    glow: "",
    text: "text-zinc-400",
  },
};

export default function ProgressBar({
  value,
  label,
  valueLabel,
  color = "emerald",
  size = "sm",
  showPercentage = false,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(1, value));
  const colors = colorMap[color];
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="w-full">
      {(label || valueLabel || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
          )}
          <span className={`data-value text-[11px] ${colors.text}`}>
            {valueLabel || (showPercentage ? `${(clampedValue * 100).toFixed(0)}%` : clampedValue.toFixed(2))}
          </span>
        </div>
      )}
      <div className={`w-full ${height} bg-zinc-900 rounded-full overflow-hidden`}>
        <div
          className={`${height} rounded-full ${colors.bar} ${colors.glow} transition-all duration-700 ease-out`}
          style={{ width: `${clampedValue * 100}%` }}
        />
      </div>
    </div>
  );
}
