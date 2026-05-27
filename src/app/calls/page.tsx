import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CallAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const calls = await db.call.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lead: {
        include: { campaign: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Calls</h2>
        <p className="mt-1.5 text-sm text-muted-foreground/70 nums">
          {calls.length} call{calls.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {calls.length === 0 ? (
        <Card className="empty-state-container flex flex-col items-center justify-center gap-5 p-20 border-dashed border-border/50 bg-card/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl icon-container-primary glow-logo">
            <PhoneCall className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold">No calls yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2 leading-relaxed">Start a campaign to see calls here.</p>
          </div>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const analysis: CallAnalysis | null = call.analysis
                    ? (() => { try { return JSON.parse(call.analysis!); } catch { return null; } })()
                    : null;

                  const durationSec =
                    call.startedAt && call.endedAt
                      ? Math.round(
                          (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
                        )
                      : null;

                  return (
                    <tr
                      key={call.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/leads/${call.leadId}`} className="font-medium hover:text-primary transition-colors">
                          {call.lead.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{call.lead.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/campaigns/${call.lead.campaign.id}`} className="text-xs text-muted-foreground hover:text-primary">
                          {call.lead.campaign.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-4 py-3">
                        {analysis ? (
                          <StatusBadge status={analysis.outcome} />
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {analysis?.interestScore != null ? `${analysis.interestScore}/100` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {durationSec != null ? `${durationSec}s` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {call.startedAt
                          ? new Date(call.startedAt).toLocaleString()
                          : new Date(call.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
