"use client";

import { LoaderCircle } from "lucide-react";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-zinc-500">
      <LoaderCircle size={24} className="animate-spin text-emerald-500/60" />
      <p className="text-[12px] font-mono">{message}</p>
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
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-6 text-center">
      <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <span className="text-red-400 text-lg">!</span>
      </div>
      <p className="text-[13px] font-medium text-zinc-300">{message}</p>
      {detail && <p className="text-[11px] text-zinc-600 max-w-md">{detail}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-[11px] mt-2"
        >
          Retry
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
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-8 text-center text-zinc-600 border border-dashed border-zinc-800/50 rounded-lg">
      {icon && <div className="opacity-30 mb-1">{icon}</div>}
      <p className="text-[13px] font-medium text-zinc-400">{message}</p>
      {sub && <p className="text-[11px] text-zinc-600">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
