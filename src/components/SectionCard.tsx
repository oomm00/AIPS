"use client";

import { ReactNode } from "react";
import Card from "@/components/Card";
import SectionHeader from "@/components/SectionHeader";

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
    <Card className={`overflow-hidden ${className}`}>
      <div className="border-b border-white/5 px-6 pb-4 pt-6">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          badge={badge}
          action={headerRight}
          size="md"
          className="items-center"
        />
      </div>
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </Card>
  );
}
