import Link from "next/link";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { id: true, name: true } },
      calls: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Leads</h2>
        <p className="mt-1.5 text-sm text-muted-foreground/70 nums">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} across all campaigns
        </p>
      </div>

      {leads.length === 0 ? (
        <Card className="empty-state-container flex flex-col items-center justify-center gap-5 p-20 border-dashed border-border/50 bg-card/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl icon-container-primary glow-logo">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold">No leads yet</p>
            <p className="text-sm text-muted-foreground/70 mt-2 leading-relaxed">
              Create a campaign and upload a CSV to see leads here.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const analysis = lead.calls[0]?.analysis
                    ? (() => { try { return JSON.parse(lead.calls[0].analysis!); } catch { return null; } })()
                    : null;

                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/leads/${lead.id}`} className="font-medium hover:text-primary transition-colors">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{lead.phone}</td>
                      <td className="px-4 py-3">
                        <Link href={`/campaigns/${lead.campaign.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          {lead.campaign.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {analysis?.interestScore != null ? `${analysis.interestScore}/100` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
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
