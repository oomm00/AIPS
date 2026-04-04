"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { systemStatus, workerProfile } from "@/lib/mockData";

const routeTitles: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Worker Dashboard",
  "/simulate": "Simulation Lab",
  "/policy": "Policy Detail",
  "/triggers": "Trigger History",
  "/fraud": "Fraud Signals",
};

export default function TopNav() {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "AIPS";

  const allOperational =
    systemStatus.triggerEngine === "operational" &&
    systemStatus.attributionEngine === "operational" &&
    systemStatus.fraudEngine === "operational" &&
    systemStatus.payoutEngine === "operational";

  return (
    <header className="sticky top-0 z-30 h-14 glass-panel border-b border-zinc-800/50 flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <h1 className="text-[13px] font-medium text-zinc-300 tracking-tight">
          {title}
        </h1>
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-zinc-600">
          <span className={`w-1.5 h-1.5 rounded-full ${allOperational ? "bg-emerald-500 animate-pulse-slow" : "bg-amber-500"}`} />
          <span>{allOperational ? "All Systems Operational" : "Degraded"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search stub */}
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.02] border border-zinc-800/50 hover:border-zinc-700/50 text-zinc-600 text-[11px] transition-colors">
          <Search size={12} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline-flex items-center px-1 h-4 rounded bg-zinc-800/50 text-[9px] text-zinc-600 font-mono ml-4">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-md hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-300 transition-colors">
          <Bell size={14} />
          {systemStatus.pendingReviews > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-zinc-800/50">
          <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
            <span className="text-[11px] font-medium text-zinc-300">
              {workerProfile.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] font-medium text-zinc-300 leading-tight">{workerProfile.name}</p>
            <p className="text-[9px] text-zinc-600 font-mono">{workerProfile.partnerId}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
