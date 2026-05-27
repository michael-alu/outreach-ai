import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Phone, Sparkles, MessageSquare, Info } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LeadRecallButton } from "@/components/leads/lead-recall-button";
import { RECALLABLE_STATUSES } from "@/lib/lead-constants";
import type { CallAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      campaign: true,
      calls: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const context = (() => { try { return JSON.parse(lead.context); } catch { return {}; } })();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/campaigns/${lead.campaignId}`} className="hover:text-foreground">
          {lead.campaign.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{lead.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{lead.name}</h2>
          <p className="mt-0.5 font-mono text-sm text-muted-foreground">{lead.phone}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={lead.status} />
          <LeadRecallButton leadId={lead.id} leadName={lead.name} />
        </div>
      </div>

      {/* Recall advisory */}
      {RECALLABLE_STATUSES.includes(lead.status) && lead.calls.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
          <span>
            This lead has been called before. You can recall them — consider reviewing the call analysis below
            before doing so to tailor the approach.
          </span>
        </div>
      )}

      {/* Context */}
      {Object.keys(context).length > 0 && (
        <Card className="p-5 border-border/60 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" /> Lead Context
          </h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {Object.entries(context).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground capitalize">{k}</dt>
                <dd className="text-sm">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Claude angle */}
      {lead.angle && (
        <Card className="p-5 border-border/60 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Claude Pitch Angle
          </h3>
          <p className="text-sm text-muted-foreground">{lead.angle}</p>
        </Card>
      )}

      {/* Generated prompt */}
      {lead.generatedPrompt && (
        <Card className="p-5 border-border/60 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generated System Prompt
          </h3>
          <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto">
            {lead.generatedPrompt}
          </pre>
        </Card>
      )}

      {/* Calls */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">
          Call History ({lead.calls.length})
        </h3>
        {lead.calls.length === 0 ? (
          <Card className="flex items-center justify-center p-8 border-dashed border-border/60 bg-card/40">
            <p className="text-sm text-muted-foreground">No calls yet</p>
          </Card>
        ) : (
          lead.calls.map((call) => {
            const analysis: CallAnalysis | null = call.analysis
              ? (() => { try { return JSON.parse(call.analysis!); } catch { return null; } })()
              : null;

            return (
              <Card key={call.id} className="border-border/60 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={call.status} />
                    {call.startedAt && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(call.startedAt).toLocaleString()}
                      </span>
                    )}
                    {call.startedAt && call.endedAt && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {Math.round(
                          (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
                        )}s
                      </span>
                    )}
                  </div>
                  {analysis && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Interest</span>
                      <span className="font-mono text-sm font-semibold">
                        {analysis.interestScore}/100
                      </span>
                    </div>
                  )}
                </div>

                {analysis && (
                  <div className="p-5 space-y-4">
                    {/* Summary */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm">{analysis.summary}</p>
                    </div>

                    {/* Objections */}
                    {analysis.objections.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Objections</p>
                        <ul className="space-y-1">
                          {analysis.objections.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next step */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Next Step</p>
                      <p className="text-sm">{analysis.nextStep}</p>
                    </div>

                    {/* Follow-up draft */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Follow-up Draft
                      </p>
                      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                        {analysis.followUpDraft}
                      </div>
                    </div>
                  </div>
                )}

                {call.transcript && (
                  <details className="border-t border-border/40">
                    <summary className="px-5 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                      View transcript
                    </summary>
                    <pre className="px-5 pb-5 whitespace-pre-wrap text-xs font-mono text-muted-foreground bg-muted/20 overflow-x-auto">
                      {call.transcript}
                    </pre>
                  </details>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
