"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Play, Sparkles, Phone, ChevronRight,
  ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RollupTrigger } from "./rollup-trigger";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProductInfo, LeadStatus } from "@/lib/types";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  priorityRank: number | null;
  angle: string | null;
  context: string;
  calls: Array<{ id: string; status: string; analysis: string | null }>;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  productInfo: ProductInfo;
  createdAt: Date;
}

interface Props {
  campaign: Campaign;
  leads: Lead[];
}

export function CampaignDetailClient({ campaign, leads: initialLeads }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [enriching, setEnriching] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleEnrich() {
    setEnriching(true);
    const t = toast.loading("Claude is enriching & prioritizing leads…");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/enrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrichment failed");
      toast.success(`${data.enriched} leads enriched`, { id: t });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enrichment failed", { id: t });
    } finally {
      setEnriching(false);
    }
  }

  async function handleStartCalling() {
    setStarting(true);
    const t = toast.loading("Starting call queue…");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      toast.success("Campaign started", { id: t });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start", { id: t });
    } finally {
      setStarting(false);
    }
  }

  const enrichedCount = leads.filter((l) => l.angle).length;
  const canEnrich = leads.length > 0;
  const canCall = leads.length > 0 && campaign.productInfo.name;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{campaign.name}</span>
          </div>
          <h2 className="text-xl font-semibold">{campaign.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {campaign.productInfo.name} · {leads.length} lead{leads.length !== 1 ? "s" : ""}
            {enrichedCount > 0 && ` · ${enrichedCount} enriched`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RollupTrigger campaignId={campaign.id} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrich}
            disabled={enriching || !canEnrich}
            className="gap-2"
          >
            {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Enrich & Prioritize
          </Button>
          <Button
            size="sm"
            onClick={handleStartCalling}
            disabled={starting || !canCall}
            className="gap-2"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start Calling
          </Button>
        </div>
      </div>

      {/* Product summary */}
      <Card className="p-4 border-border/60 bg-card/60">
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">
            Product: <span className="text-foreground font-medium">{campaign.productInfo.name}</span>
          </span>
          <span className="text-muted-foreground">
            Price: <span className="text-foreground font-mono">{campaign.productInfo.price}</span>
          </span>
          <span className="text-muted-foreground">
            CTA: <span className="text-foreground">{campaign.productInfo.cta}</span>
          </span>
          <span className="text-muted-foreground">
            Language: <span className="text-foreground">{campaign.productInfo.language}</span>
          </span>
        </div>
      </Card>

      {/* Leads table */}
      {leads.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 border-dashed border-border/60 bg-card/40">
          <Phone className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload a CSV to get started.</p>
          </div>
        </Card>
      ) : (
        <Card className="border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Claude Angle</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => {
                  const latestCall = lead.calls[0];
                  const analysis = latestCall?.analysis
                    ? (() => { try { return JSON.parse(latestCall.analysis); } catch { return null; } })()
                    : null;

                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {lead.priorityRank ?? i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{lead.name}</p>
                        {analysis?.interestScore != null && (
                          <p className="text-xs text-muted-foreground font-mono">
                            Score: {analysis.interestScore}/100
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {lead.phone}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status as LeadStatus} />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {lead.angle ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">{lead.angle}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground/40 italic">Not enriched yet</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
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
