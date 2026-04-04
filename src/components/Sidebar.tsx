"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Shield,
  Activity,
  UserPlus,
  ClipboardList,
  TerminalSquare,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/simulate", icon: FlaskConical, label: "Simulation Lab" },
  { href: "/policy", icon: FileText, label: "Policy" },
  { href: "/register", icon: UserPlus, label: "Register Worker" },
  { href: "/audit", icon: ClipboardList, label: "Audit Trail" },
  { href: "/engine-debug", icon: TerminalSquare, label: "Engine Debug" },
  { href: "/admin", icon: Settings2, label: "Admin" },
];

const bottomItems = [
  { href: "/triggers", icon: Activity, label: "Trigger History" },
  { href: "/fraud", icon: Shield, label: "Fraud Signals" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const renderLink = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-link ${isActive ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-zinc-800/50 bg-surface transition-all duration-200 ${
        collapsed ? "w-[56px]" : "w-[200px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-zinc-800/50 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-500 text-xs font-bold font-mono">A</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="text-[13px] font-semibold tracking-tighter text-zinc-100">AIPS</p>
            <p className="text-[9px] text-zinc-600 tracking-wider uppercase">Income Protection</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest px-2 pb-1.5">Main</p>
        )}
        {navItems.map(renderLink)}

        {!collapsed && (
          <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest px-2 pt-3 pb-1.5">Analytics</p>
        )}
        {collapsed && <div className="my-2 border-t border-zinc-800/30" />}
        {bottomItems.map(renderLink)}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-zinc-800/50 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-white/[0.03] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
