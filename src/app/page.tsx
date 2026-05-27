import Link from "next/link";
import { Plus, PhoneCall, Users, TrendingUp, Zap, Megaphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalCalls, completedLeads, enrichedLeads, campaigns] =
    await Promise.all([
      db.call.count(),
      db.lead.count({ where: { status: "COMPLETED" } }),
      db.lead.count({ where: { status: { in: ["ENRICHED", "QUEUED", "RINGING", "IN_PROGRESS", "COMPLETED"] } } }),
      db.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { leads: true } } },
      }),
    ]);

  const answeredCalls = await db.call.count({ where: { status: "COMPLETED" } });
  const connectRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : null;

  const statCards = [
    {
      label: "Total Calls",
      value: totalCalls > 0 ? totalCalls.toString() : "—",
      sub: "All time",
      icon: PhoneCall,
      iconClass: "icon-container-neutral text-muted-foreground",
    },
    {
      label: "Connect Rate",
      value: connectRate != null ? `${connectRate}%` : "—",
      sub: "Answered / dialed",
      icon: TrendingUp,
      iconClass: "icon-container-success icon-success",
    },
    {
      label: "Leads Enriched",
      value: enrichedLeads > 0 ? enrichedLeads.toString() : "—",
      sub: "By Claude AI",
      icon: Users,
      iconClass: "icon-container-primary text-primary",
    },
    {
      label: "Conversions",
      value: completedLeads > 0 ? completedLeads.toString() : "—",
      sub: "Completed calls",
      icon: Zap,
      iconClass: "icon-container-warning icon-warning",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="mt-1.5 text-sm text-muted-foreground/70 leading-relaxed">
            Your campaign performance at a glance.
          </p>
        </div>
        <Link href="/campaigns/new" className={cn(buttonVariants({ size: "sm" }), "gap-2 glow-primary transition-all duration-150")}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, iconClass }) => (
          <Card
            key={label}
            className="card-elevated flex flex-col gap-3 p-5 border-border/60 transition-all duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                {label}
              </span>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClass)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="nums font-mono text-4xl font-semibold leading-none">{value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground/50">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent campaigns */}
      {campaigns.length === 0 ? (
        <Card className="empty-state-container flex flex-col items-center justify-center gap-5 p-20 border-dashed border-border/50 bg-card/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl icon-container-primary glow-logo">
            <Megaphone className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-lg font-semibold text-foreground">No campaigns yet</h3>
            <p className="mt-2 text-sm text-muted-foreground/70 leading-relaxed">
              Upload a CSV of leads, configure your pitch, and let Claude AI handle the calls.
            </p>
          </div>
          <Link href="/campaigns/new" className={cn(buttonVariants(), "gap-2 mt-1 glow-primary transition-all duration-150")}>
            <Plus className="h-4 w-4" />
            Create your first campaign
          </Link>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Recent Campaigns</h3>
            <Link href="/campaigns" className="text-xs text-primary/80 hover:text-primary transition-colors duration-150">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {campaigns.map((c: typeof campaigns[number]) => (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <Card className="flex items-center justify-between p-4 border-border/50 hover:border-primary/30 transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-container-primary shrink-0">
                      <Megaphone className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="nums text-xs text-muted-foreground/60">
                      {c._count.leads} lead{c._count.leads !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="nums font-mono text-xs text-muted-foreground/50">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
