"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function SectionCard({
  title,
  subtitle,
  badge,
  headerRight,
  children,
  className = "",
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-zinc-200 tracking-tight">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {headerRight && (
          <div className="flex-shrink-0">{headerRight}</div>
        )}
      </div>

      {/* Content */}
      <div className={noPadding ? "" : "px-5 pb-4"}>
        {children}
      </div>
    </div>
  );
}
