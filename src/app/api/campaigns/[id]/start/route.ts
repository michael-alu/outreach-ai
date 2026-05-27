import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVapiProvider } from "@/lib/telephony/vapi";

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
          where: { status: { in: ["NEW", "ENRICHED"] } },
          orderBy: [{ priorityRank: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.leads.length === 0) {
      return NextResponse.json({ error: "No leads ready to call" }, { status: 400 });
    }

    const webhookUrl = `${process.env.APP_BASE_URL}/api/calls/webhook`;
    const vapi = getVapiProvider();

    await db.campaign.update({ where: { id }, data: { status: "ACTIVE" } });

    // Queue all leads and place calls sequentially (Vapi handles call-level queuing)
    const queued: string[] = [];

    for (const lead of campaign.leads) {
      try {
        // Mark as queued
        await db.lead.update({ where: { id: lead.id }, data: { status: "QUEUED" } });

        const systemPrompt =
          lead.generatedPrompt ??
          `You are an AI sales agent for ${campaign.name}. Call this lead and introduce the product professionally. You must disclose at the start that you are an AI assistant.`;

        const result = await vapi.placeCall({
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone,
          systemPrompt,
          campaignId: id,
          webhookUrl,
        });

        // Create call record
        await db.call.create({
          data: {
            leadId: lead.id,
            vapiCallId: result.vapiCallId,
            status: "INITIATED",
          },
        });

        await db.lead.update({
          where: { id: lead.id },
          data: { status: "RINGING" },
        });

        queued.push(lead.id);
      } catch (err) {
        console.error(`[start] failed to call lead ${lead.id}`, err);
        await db.lead.update({ where: { id: lead.id }, data: { status: "FAILED" } });
        await db.call.create({
          data: { leadId: lead.id, status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ started: queued.length, total: campaign.leads.length });
  } catch (err) {
    console.error("[start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start" },
      { status: 500 }
    );
  }
}
