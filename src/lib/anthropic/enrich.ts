import { z } from "zod";
import { getAnthropicClient, SONNET } from "./client";
import type { ProductInfo } from "@/lib/types";

const EnrichmentResultSchema = z.object({
  leads: z.array(
    z.object({
      id: z.string(),
      priorityRank: z.number().int().min(1),
      angle: z.string().min(1),
    })
  ),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

export async function enrichLeads(
  leads: Array<{ id: string; name: string; phone: string; context: string }>,
  productInfo: ProductInfo
): Promise<EnrichmentResult> {
  const client = getAnthropicClient();

  const leadsText = leads
    .map(
      (l, i) =>
        `Lead ${i + 1}: id=${l.id}, name="${l.name}", context=${l.context}`
    )
    .join("\n");

  const prompt = `You are a sales strategy AI. Given a product and a list of leads, rank them by conversion likelihood (1 = most likely to convert) and generate a 1–2 sentence tailored pitch angle for each lead.

PRODUCT:
- Name: ${productInfo.name}
- Description: ${productInfo.description}
- Value props: ${productInfo.valueProps.join("; ")}
- Price: ${productInfo.price}
- CTA: ${productInfo.cta}

LEADS:
${leadsText}

Return ONLY a JSON object matching this exact schema — no markdown, no explanation:
{
  "leads": [
    { "id": "<lead id>", "priorityRank": <integer>, "angle": "<1-2 sentence angle>" }
  ]
}

The priorityRank must be unique and sequential starting from 1. Every lead must appear in the output.`;

  async function attempt(): Promise<EnrichmentResult> {
    const msg = await client.messages.create({
      model: SONNET,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = EnrichmentResultSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) throw new Error("Schema mismatch: " + parsed.error.message);
    return parsed.data;
  }

  try {
    return await attempt();
  } catch {
    return await attempt(); // one retry on parse failure
  }
}
