import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeRwandaPhone } from "@/lib/phone";

const LeadInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  context: z.record(z.string(), z.string()).optional().default({}),
});

const UploadSchema = z.object({
  campaignId: z.string().min(1),
  leads: z.array(LeadInputSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campaignId, leads } = parsed.data;

    // Validate campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const errors: Array<{ row: number; phone: string; error: string }> = [];
    const valid: typeof leads = [];

    for (const [i, lead] of leads.entries()) {
      const normalized = normalizeRwandaPhone(lead.phone);
      if (!normalized) {
        errors.push({ row: i + 1, phone: lead.phone, error: "Invalid +250 phone number" });
      } else {
        valid.push({ ...lead, phone: normalized });
      }
    }

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "No valid leads", validationErrors: errors },
        { status: 422 }
      );
    }

    const created = await db.$transaction(
      valid.map((lead) =>
        db.lead.create({
          data: {
            campaignId,
            name: lead.name,
            phone: lead.phone,
            context: JSON.stringify(lead.context),
            status: "NEW",
          },
        })
      )
    );

    return NextResponse.json({
      created: created.length,
      skipped: errors.length,
      validationErrors: errors,
      leads: created,
    });
  } catch (err) {
    console.error("[leads/upload]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
