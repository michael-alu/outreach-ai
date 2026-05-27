"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  PhoneCall,
  Plus,
  Upload,
} from "lucide-react";
import { useCommandPalette } from "@/hooks/use-command-palette";

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggle]);

  function run(fn: () => void) {
    fn();
    close();
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <Command className="rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-center border-b border-border px-3">
          <CommandInput
            placeholder="Type a command or search…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <CommandList className="max-h-80 overflow-y-auto p-2">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          <CommandGroup heading="Navigate" className="text-xs text-muted-foreground px-2 py-1">
            <CommandItem
              onSelect={() => run(() => router.push("/"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/campaigns"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              Campaigns
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/leads"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              Leads
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/calls"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              Calls
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="my-1 border-t border-border" />

          <CommandGroup heading="Actions" className="text-xs text-muted-foreground px-2 py-1">
            <CommandItem
              onSelect={() => run(() => router.push("/campaigns/new"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              New Campaign
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/campaigns/new?step=upload"))}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm cursor-pointer"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              Upload CSV
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
