"use client";

interface StatusBadgeProps {
  status: "paid" | "pending" | "rejected" | "review" | "active" | "operational" | "degraded" | "down";
  size?: "sm" | "md";
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  paid: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Paid",
  },
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-500",
    label: "Pending",
  },
  rejected: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-500",
    label: "Rejected",
  },
  review: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "In Review",
  },
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Active",
  },
  operational: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    label: "Operational",
  },
  degraded: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    label: "Degraded",
  },
  down: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
    label: "Down",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-md ${config.bg} ${config.text} ${textSize} font-medium tracking-wide`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === "active" || status === "operational" ? "animate-pulse-slow" : ""}`} />
      {config.label}
    </span>
  );
}
