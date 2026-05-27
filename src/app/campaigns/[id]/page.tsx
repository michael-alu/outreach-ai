import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CampaignDetailClient } from "@/components/campaigns/campaign-detail-client";
import type { ProductInfo } from "@/lib/types";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: [{ priorityRank: "asc" }, { createdAt: "asc" }],
        include: { calls: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!campaign) notFound();

  const productInfo: ProductInfo = (() => {
    try { return JSON.parse(campaign.productInfo); }
    catch { return { name: "", description: "", valueProps: [], price: "", objections: [], cta: "", language: "English" }; }
  })();

  return (
    <CampaignDetailClient
      campaign={{ ...campaign, productInfo }}
      leads={campaign.leads}
    />
  );
}
