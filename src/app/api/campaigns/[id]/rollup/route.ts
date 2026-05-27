import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRollup } from "@/lib/anthropic/rollup";
import type { CallAnalysis } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          include: { calls: { where: { analysis: { not: null } }, orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const totalCalls = campaign.leads.filter((l) =>
      ["COMPLETED", "NO_ANSWER", "FAILED"].includes(l.status)
    ).length;

    const answeredCalls = campaign.leads.filter((l) => l.status === "COMPLETED").length;

    const analyses: CallAnalysis[] = campaign.leads
      .flatMap((l) => l.calls)
      .filter((c) => c.analysis)
      .map((c) => {
        try { return JSON.parse(c.analysis!) as CallAnalysis; }
        catch { return null; }
      })
      .filter(Boolean) as CallAnalysis[];

    if (analyses.length === 0) {
      return NextResponse.json({ error: "No completed calls to analyze" }, { status: 400 });
    }

    const rollup = await generateRollup(analyses, totalCalls, answeredCalls);

    await db.campaign.update({
      where: { id },
      data: {
        rollupAnalysis: JSON.stringify(rollup),
        status: "COMPLETED",
      },
    });

    return NextResponse.json(rollup);
  } catch (err) {
    console.error("[rollup]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Rollup failed" },
      { status: 500 }
    );
  }
}
