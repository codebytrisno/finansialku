"use client";

import { useEffect, type ReactNode } from "react";
import { initializeStore, initTheme } from "@/lib/store";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    initializeStore();
    initTheme();
  }, []);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:ml-[280px] lg:pb-0">
        <main className="flex-1 p-gutter max-w-full">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
