"use client";

import { ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  indicatorClassName?: string;
  unit?: string;
  className?: string;
  valueClassName?: string;
}

export default function MetricTile({
  label,
  value,
  helper,
  icon,
  indicatorClassName = "bg-emerald-400",
  unit,
  className = "",
  valueClassName = "text-gray-100",
}: MetricTileProps) {
  return (
    <div className={["p-6", className].join(" ")}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={["h-2.5 w-2.5 rounded-full", indicatorClassName].join(" ")} />
          <p className="text-sm text-gray-400">{label}</p>
        </div>
        {icon ? <div className="text-gray-400">{icon}</div> : null}
      </div>
      <div className="flex items-end gap-2">
        <p className={`data-value text-2xl font-semibold ${valueClassName}`}>{value}</p>
        {unit ? <p className="pb-0.5 text-sm text-gray-400">{unit}</p> : null}
      </div>
      {helper ? <p className="mt-2 text-sm text-gray-500">{helper}</p> : null}
    </div>
  );
}
