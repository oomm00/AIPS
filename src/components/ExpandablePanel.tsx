"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface ExpandablePanelProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function ExpandablePanel({
  trigger,
  children,
  defaultOpen = false,
}: ExpandablePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-md bg-white/[0.02] border border-zinc-800/40 hover:border-zinc-700/40 hover:bg-white/[0.03] transition-all text-left group"
      >
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
          {trigger}
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-md border border-zinc-800/30 bg-zinc-950/50 p-3">
          {children}
        </div>
      </div>
    </div>
  );
}
