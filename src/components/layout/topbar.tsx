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
      <h1 className="text-sm font-semibold text-foreground">
        {getTitle(pathname)}
      </h1>
      <button
        onClick={open}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 gap-2 text-xs text-muted-foreground hover:text-foreground border-border/60"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        Search…
        <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
