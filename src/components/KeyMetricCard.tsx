"use client";

import { ReactNode } from "react";
import Card from "@/components/Card";
import MetricTile from "@/components/MetricTile";

interface KeyMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  icon?: ReactNode;
  accent?: "emerald" | "amber" | "red" | "sky" | "zinc";
  mono?: boolean;
}

const accentMap: Record<"emerald" | "amber" | "red" | "sky" | "zinc", { value: string; indicator: string; ring: string }> = {
  emerald: { value: "text-emerald-300", indicator: "bg-emerald-400", ring: "hover:shadow-glow" },
  amber: { value: "text-amber-300", indicator: "bg-amber-400", ring: "hover:shadow-glow-amber" },
  red: { value: "text-red-300", indicator: "bg-red-400", ring: "hover:shadow-glow-red" },
  sky: { value: "text-sky-300", indicator: "bg-sky-400", ring: "hover:shadow-glow-sky" },
  zinc: { value: "text-gray-100", indicator: "bg-gray-500", ring: "hover:shadow-glass" },
};

export default function KeyMetricCard({
  label,
  value,
  unit,
  sub,
  icon,
  accent = "zinc",
  mono = true,
}: KeyMetricCardProps) {
  const palette = accentMap[accent];
  const numericValue = mono ? <span className="data-value">{value}</span> : value;

  return (
    <Card className={`group overflow-hidden ${palette.ring}`}>
      <div className={"border-l-2 border-white/5"}>
        <MetricTile
          label={label}
          value={numericValue}
          unit={unit}
          helper={sub}
          icon={icon}
          indicatorClassName={`${palette.indicator} ${accent !== "zinc" ? "animate-pulse-slow" : ""}`}
          valueClassName={palette.value}
        />
      </div>
    </Card>
  );
}
