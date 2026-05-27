"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { CommandPalette } from "@/components/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <footer className="shrink-0 border-t border-border/40 px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground/50">
            AI accelerating economic opportunity — one conversation at a time.
          </p>
          <p className="text-[11px] text-muted-foreground/40 font-mono">
            © {new Date().getFullYear()} outreach
          </p>
        </footer>
      </div>
      <CommandPalette />
    </div>
  );
}
