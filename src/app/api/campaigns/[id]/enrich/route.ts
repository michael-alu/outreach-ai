import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrichLeads } from "@/lib/anthropic/enrich";
import { generateCallPrompt } from "@/lib/anthropic/generate-prompt";
import type { ProductInfo } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: { leads: { where: { status: { in: ["NEW", "ENRICHED"] } } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.leads.length === 0) {
      return NextResponse.json({ error: "No leads to enrich" }, { status: 400 });
    }

    const productInfo: ProductInfo = JSON.parse(campaign.productInfo);

    // §5.1 — Enrich & prioritize
    const enrichment = await enrichLeads(
      campaign.leads.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        context: l.context,
      })),
      productInfo
    );

    // §5.2 — Per-call prompt generation (parallel)
    const promptResults = await Promise.all(
      enrichment.leads.map(async (result) => {
        const lead = campaign.leads.find((l) => l.id === result.id)!;
        const generatedPrompt = await generateCallPrompt(
          { ...lead, angle: result.angle },
          productInfo
        );
        return { ...result, generatedPrompt };
      })
    );

    // Persist
    await db.$transaction(
      promptResults.map((r) =>
        db.lead.update({
          where: { id: r.id },
          data: {
            priorityRank: r.priorityRank,
            angle: r.angle,
            generatedPrompt: r.generatedPrompt,
            status: "ENRICHED",
          },
        })
      )
    );

    return NextResponse.json({ enriched: promptResults.length });
  } catch (err) {
    console.error("[enrich]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrichment failed" },
      { status: 500 }
    );
  }
}
