import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVapiProvider } from "@/lib/telephony/vapi";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await db.lead.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const webhookUrl = `${process.env.APP_BASE_URL}/api/calls/webhook`;
    const vapi = getVapiProvider();

    const systemPrompt =
      lead.generatedPrompt ??
      `You are an AI sales agent for ${lead.campaign.name}. Call this lead and introduce the product professionally. You must disclose at the start that you are an AI assistant.`;

    await db.lead.update({ where: { id }, data: { status: "QUEUED" } });

    const result = await vapi.placeCall({
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      systemPrompt,
      campaignId: lead.campaignId,
      webhookUrl,
    });

    await db.call.create({
      data: {
        leadId: lead.id,
        vapiCallId: result.vapiCallId,
        status: "INITIATED",
      },
    });

    await db.lead.update({ where: { id }, data: { status: "RINGING" } });

    return NextResponse.json({ vapiCallId: result.vapiCallId });
  } catch (err) {
    console.error("[lead recall]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to recall" },
      { status: 500 }
    );
  }
}
