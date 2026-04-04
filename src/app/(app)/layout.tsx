"use client";

import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-[200px] transition-all duration-200 flex flex-col">
        <TopNav />
        <main className="flex-1 p-5 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
