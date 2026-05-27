import { TrendingUp, AlertCircle, Lightbulb, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BatchRollup } from "@/lib/types";

interface Props {
  rollup: BatchRollup;
  campaignName: string;
}

export function DashboardRollup({ rollup, campaignName }: Props) {
  const distribution = rollup.interestDistribution ?? {};
  const total = Object.values(distribution).reduce((a: number, b) => a + (b as number), 0) || 1;

  const barColors: Record<string, string> = {
    INTERESTED: "bg-green-400",
    CALLBACK: "bg-blue-400",
    NOT_INTERESTED: "bg-muted-foreground/40",
    NO_ANSWER: "bg-amber-400",
    FAILED: "bg-destructive/60",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          Claude Campaign Analysis
        </h3>
        <span className="text-xs text-muted-foreground">{campaignName}</span>
      </div>

      {/* Summary */}
      <Card className="p-5 border-border/60 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Executive Summary</p>
        <p className="text-sm leading-relaxed">{rollup.summary}</p>
      </Card>

      {/* Metrics row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-border/60">
          <p className="text-xs text-muted-foreground">Connect Rate</p>
          <p className="font-mono text-2xl font-semibold mt-1">{rollup.connectRate}%</p>
        </Card>

        {/* Interest distribution */}
        <Card className="p-4 border-border/60 sm:col-span-2 space-y-3">
          <p className="text-xs text-muted-foreground">Outcome Distribution</p>
          <div className="space-y-1.5">
            {Object.entries(distribution).map(([outcome, count]) => (
              <div key={outcome} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28 truncate">{outcome}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColors[outcome] ?? "bg-primary"}`}
                    style={{ width: `${Math.round(((count as number) / total) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground w-6 text-right">{count as number}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Objections + Script improvements */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 border-border/60 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            Top Objections
          </p>
          <ul className="space-y-2">
            {rollup.topObjections.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {obj}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 border-border/60 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            Script Improvements
          </p>
          <ul className="space-y-2">
            {rollup.scriptImprovements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs text-primary mt-0.5 shrink-0">{i + 1}.</span>
                {imp}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
