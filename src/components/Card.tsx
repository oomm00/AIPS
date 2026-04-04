"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function Card({ children, className = "", hoverable = true }: CardProps) {
  return (
    <div
      className={[
        "card rounded-2xl border border-white/10 bg-[#111827]/90 shadow-glass backdrop-blur-sm",
        hoverable ? "transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
