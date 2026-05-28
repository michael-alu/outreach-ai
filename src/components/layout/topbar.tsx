"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/hooks/use-command-palette";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/leads": "Leads",
  "/calls": "Calls",
  "/about": "About",
};

function getTitle(pathname: string): string {
  if (pathname === "/") return titles["/"];
  const key = Object.keys(titles)
    .filter((k) => k !== "/")
    .find((k) => pathname.startsWith(k));
  return key ? titles[key] : "Outreach";
}

export function TopBar() {
  const pathname = usePathname();
  const { open } = useCommandPalette();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h1 className="text-sm font-bold tracking-tight text-foreground">
        {getTitle(pathname)}
      </h1>
      <button
        onClick={open}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 gap-2 text-xs text-muted-foreground hover:text-foreground",
          "border-border/50 bg-background/60 shadow-[inset_0_1px_2px_oklch(0_0_0/20%)]",
          "transition-colors duration-150"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        Search…
        <kbd className="ml-1 rounded border border-border/60 bg-muted/80 px-1.5 py-0.5 text-[9px] font-mono tracking-wide">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
