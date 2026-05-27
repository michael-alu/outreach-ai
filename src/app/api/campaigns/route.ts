import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  productInfo: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    valueProps: z.array(z.string()).min(1),
    price: z.string().min(1),
    objections: z.array(z.string()),
    cta: z.string().min(1),
    language: z.string().default("English"),
  }),
});

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { leads: true } },
      },
    });
    console.log({ campaign: campaigns[0] });
    return NextResponse.json(campaigns);
  } catch (err) {
    console.error("[campaigns GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name: parsed.data.name,
        productInfo: JSON.stringify(parsed.data.productInfo),
        status: "DRAFT",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[campaigns POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
