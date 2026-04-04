"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  size?: "lg" | "md";
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  badge,
  action,
  size = "lg",
  className = "",
}: SectionHeaderProps) {
  const titleClassName = size === "lg"
    ? "text-2xl md:text-3xl font-bold"
    : "text-base md:text-lg font-semibold";

  return (
    <div className={["flex items-start justify-between gap-3", className].join(" ")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className={`${titleClassName} tracking-tight text-gray-100`}>{title}</h2>
          {badge}
        </div>
        {subtitle ? <p className={`mt-1 ${size === "lg" ? "text-sm" : "text-xs"} text-gray-400`}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
