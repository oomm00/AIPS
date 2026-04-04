"use client";

import { LoaderCircle } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="animate-fade-in space-y-5 py-6">
      <div className="flex items-center gap-3 text-gray-300">
        <LoaderCircle size={20} className="animate-spin text-emerald-400" />
        <p className="text-sm font-medium tracking-wide">{message}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  detail,
  onRetry,
}: {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] gap-4 p-8 text-center bg-[#111827]/50 rounded-2xl border border-red-500/10 shadow-glow-red animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-glow-red">
        <span className="text-red-400 text-2xl font-bold">!</span>
      </div>
      <div>
        <p className="text-base font-semibold text-gray-200">{message}</p>
        {detail && <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{detail}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary mt-3 px-6 py-2 rounded-lg font-medium text-sm transition-transform active:scale-95"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  message,
  sub,
  action,
}: {
  icon?: React.ReactNode;
  message: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] gap-4 p-10 text-center bg-[#111827]/30 border border-dashed border-[rgba(255,255,255,0.08)] rounded-2xl animate-fade-in">
      {icon && <div className="text-gray-600 mb-2 transform scale-125">{icon}</div>}
      <div>
        <p className="text-base font-semibold text-gray-300">{message}</p>
        {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
