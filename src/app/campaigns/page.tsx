import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types";

const statusColors: Record<CampaignStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-status-active status-active border-0",
  PAUSED: "bg-status-ringing status-ringing border-0",
  COMPLETED: "bg-status-completed status-completed border-0",
};

export default async function CampaignsPage() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  console.log({ first: campaigns[0] });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className={cn(buttonVariants({ size: "sm" }), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 border-border/60 border-dashed bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">No campaigns yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Create a campaign to upload leads, configure your pitch, and start
              calling.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className={cn(buttonVariants(), "gap-2 mt-2")}
          >
            <Plus className="h-4 w-4" />
            Create your first campaign
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const info = (() => {
              try {
                return JSON.parse(c.productInfo) as { name: string };
              } catch {
                return { name: "—" };
              }
            })();
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <Card className="flex items-center justify-between p-4 border-border/60 hover:border-border transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {info.name} · {c._count.leads} lead
                        {c._count.leads !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        statusColors[c.status as CampaignStatus] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
