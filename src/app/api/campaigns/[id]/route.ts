import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  productInfo: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    valueProps: z.array(z.string()).min(1),
    price: z.string().min(1),
    objections: z.array(z.string()),
    cta: z.string().min(1),
    language: z.string().default("English"),
  }).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.productInfo && {
          productInfo: JSON.stringify(parsed.data.productInfo),
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[campaign PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Cascade: calls → leads → campaign
    await db.call.deleteMany({ where: { lead: { campaignId: id } } });
    await db.lead.deleteMany({ where: { campaignId: id } });
    await db.campaign.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[campaign DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
