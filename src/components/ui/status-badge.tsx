import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:         { label: "New",         className: "bg-muted text-muted-foreground" },
  ENRICHED:    { label: "Enriched",    className: "bg-primary/10 text-primary" },
  QUEUED:      { label: "Queued",      className: "bg-muted text-muted-foreground" },
  RINGING:     { label: "Ringing",     className: "bg-amber-500/15 text-amber-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-500/15 text-blue-400 animate-call-pulse" },
  COMPLETED:   { label: "Completed",   className: "bg-green-500/15 text-green-400" },
  NO_ANSWER:   { label: "No Answer",   className: "bg-muted text-muted-foreground" },
  FAILED:      { label: "Failed",      className: "bg-destructive/10 text-destructive" },
  // Call statuses
  INITIATED:   { label: "Initiated",   className: "bg-muted text-muted-foreground" },
};

interface Props {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
