"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Play, Sparkles, Phone, ChevronRight,
  Loader2, Pencil, Trash2, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RollupTrigger } from "./rollup-trigger";
import { AddLeadsModal } from "./add-leads-modal";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardRollup } from "@/components/dashboard/dashboard-rollup";
import type { ProductInfo, LeadStatus, BatchRollup } from "@/lib/types";

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
  rollupAnalysis: string | null;
  createdAt: Date;
}

interface Props {
  campaign: Campaign;
  leads: Lead[];
}

export function CampaignDetailClient({ campaign, leads: initialLeads }: Props) {
  const router = useRouter();
  const [leads] = useState(initialLeads);
  const [enriching, setEnriching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(campaign.name);
  const [editProduct, setEditProduct] = useState<ProductInfo>(campaign.productInfo);
  const [saving, setSaving] = useState(false);

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

  async function handleDelete() {
    if (!confirm(`Delete "${campaign.name}"? This removes all leads and call history permanently.`)) return;
    setDeleting(true);
    const t = toast.loading("Deleting campaign…");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Campaign deleted", { id: t });
      router.push("/campaigns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed", { id: t });
      setDeleting(false);
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    const t = toast.loading("Saving changes…");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, productInfo: editProduct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      toast.success("Campaign updated", { id: t });
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed", { id: t });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditName(campaign.name);
    setEditProduct(campaign.productInfo);
    setEditing(false);
  }

  const rollup: BatchRollup | null = (() => {
    if (!campaign.rollupAnalysis) return null;
    try { return JSON.parse(campaign.rollupAnalysis) as BatchRollup; }
    catch { return null; }
  })();

  const enrichedCount = leads.filter((l) => l.angle).length;
  const canEnrich = leads.length > 0;
  const canCall = leads.length > 0 && campaign.productInfo.name;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{editing ? editName : campaign.name}</span>
          </div>
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-b border-primary outline-none w-full max-w-sm"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-semibold">{campaign.name}</h2>
          )}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {campaign.productInfo.name} · {leads.length} lead{leads.length !== 1 ? "s" : ""}
            {enrichedCount > 0 && ` · ${enrichedCount} enriched`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </Button>
              <AddLeadsModal campaignId={campaign.id} />
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
            </>
          )}
        </div>
      </div>

      {/* Product summary / edit form */}
      <Card className="p-4 border-border/60 bg-card/60">
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(["name", "price", "cta", "language"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground capitalize mb-1 block">{field}</label>
                <input
                  value={editProduct[field]}
                  onChange={(e) => setEditProduct({ ...editProduct, [field]: e.target.value })}
                  className="w-full text-sm bg-transparent border border-border/60 rounded-md px-3 py-1.5 outline-none focus:border-primary"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={editProduct.description}
                onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                rows={2}
                className="w-full text-sm bg-transparent border border-border/60 rounded-md px-3 py-1.5 outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Value Props (one per line)</label>
              <textarea
                value={editProduct.valueProps.join("\n")}
                onChange={(e) => setEditProduct({ ...editProduct, valueProps: e.target.value.split("\n").filter(Boolean) })}
                rows={3}
                className="w-full text-sm bg-transparent border border-border/60 rounded-md px-3 py-1.5 outline-none focus:border-primary resize-none font-mono"
              />
            </div>
          </div>
        ) : (
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
        )}
      </Card>

      {/* Campaign rollup */}
      {rollup && (
        <Card className="p-5 border-border/60">
          <DashboardRollup rollup={rollup} campaignName={campaign.name} />
        </Card>
      )}

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
                        <Link href={`/leads/${lead.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {lead.name}
                        </Link>
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
