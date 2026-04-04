"use client";

import { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
  status?: "default" | "success" | "warning" | "danger";
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No recent activity.</p>;
  }

  return (
    <div className="relative pl-3 mt-2">
      {/* Vertical line connecting timeline nodes */}
      <div className="absolute top-2 bottom-6 left-5 border-l border-[rgba(255,255,255,0.08)]"></div>

      <div className="space-y-6">
        {items.map((item, index) => {
          let badgeColor = "bg-gray-800 border-gray-600 outline-gray-900";
          if (item.status === "success") badgeColor = "bg-emerald-500/20 border-emerald-500/50 outline-[#111827] text-emerald-400";
          if (item.status === "warning") badgeColor = "bg-amber-500/20 border-amber-500/50 outline-[#111827] text-amber-400";
          if (item.status === "danger") badgeColor = "bg-red-500/20 border-red-500/50 outline-[#111827] text-red-400";
          if (item.status === "default" || !item.status) badgeColor = "bg-[#1f2937] border-gray-600 outline-[#111827] text-gray-400";

          return (
            <div key={item.id} className={`relative flex gap-4 ${index === items.length - 1 ? "" : ""}`}>
              {/* Node Indicator */}
              <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
                <div className={`w-3 h-3 rounded-full border outline outline-4 ${badgeColor} z-10`}></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 flex-shrink-0 font-mono tracking-wider">{item.timestamp}</p>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
