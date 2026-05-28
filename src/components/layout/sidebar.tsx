"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  PhoneCall,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 glow-logo">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Outreach
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/50 hover:bg-white/[0.03] hover:text-sidebar-foreground/80",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-150",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/40",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <p className="text-[10px] text-muted-foreground/40 font-mono tracking-wide">
          Press{" "}
          <kbd className="rounded border border-border/60 bg-muted/60 px-1 py-0.5 text-[9px] font-mono">
            ⌘K
          </kbd>{" "}
          to search
        </p>
      </div>
    </aside>
  );
}
