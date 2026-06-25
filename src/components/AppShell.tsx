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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
