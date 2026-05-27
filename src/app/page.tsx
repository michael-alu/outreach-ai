import Link from "next/link";
import { Plus, PhoneCall, Users, TrendingUp, Zap, Megaphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";

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
      color: "text-blue-400",
    },
    {
      label: "Connect Rate",
      value: connectRate != null ? `${connectRate}%` : "—",
      sub: "Answered / dialed",
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Leads Enriched",
      value: enrichedLeads > 0 ? enrichedLeads.toString() : "—",
      sub: "By Claude AI",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Conversions",
      value: completedLeads > 0 ? completedLeads.toString() : "—",
      sub: "Completed calls",
      icon: Zap,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your campaign performance at a glance.
          </p>
        </div>
        <Link href="/campaigns/new" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <Card
            key={label}
            className="flex flex-col gap-3 p-5 border-border/60 bg-card hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent campaigns */}
      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 border-border/60 border-dashed bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">No campaigns yet</h3>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Upload a CSV of leads, configure your pitch, and let Claude AI handle the calls.
            </p>
          </div>
          <Link href="/campaigns/new" className={cn(buttonVariants(), "gap-2 mt-2")}>
            <Plus className="h-4 w-4" />
            Create your first campaign
          </Link>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent Campaigns</h3>
            <Link href="/campaigns" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {campaigns.map((c: typeof campaigns[number]) => (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <Card className="flex items-center justify-between p-4 border-border/60 hover:border-border transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c._count.leads} lead{c._count.leads !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
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
