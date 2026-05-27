import { z } from "zod";
import { getAnthropicClient, SONNET } from "./client";
import type { CallAnalysis, BatchRollup } from "@/lib/types";

const RollupSchema = z.object({
  connectRate: z.number().min(0).max(100),
  interestDistribution: z.record(z.string(), z.number()),
  topObjections: z.array(z.string()),
  scriptImprovements: z.array(z.string()).min(1).max(5),
  summary: z.string(),
});

/** §5.6 — Batch rollup & coaching after campaign completes */
export async function generateRollup(
  analyses: CallAnalysis[],
  totalCalls: number,
  answeredCalls: number
): Promise<BatchRollup> {
  const client = getAnthropicClient();

  const analysisText = analyses
    .map(
      (a, i) =>
        `Call ${i + 1}: outcome=${a.outcome}, score=${a.interestScore}, objections=[${a.objections.join("; ")}], summary="${a.summary}"`
    )
    .join("\n");

  const prompt = `You are a sales coach reviewing a batch of AI voice sales calls. Analyze the results and provide actionable coaching.

CAMPAIGN STATS:
- Total calls dialed: ${totalCalls}
- Calls answered: ${answeredCalls}
- Connect rate: ${totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0}%

CALL ANALYSES:
${analysisText}

Return ONLY a JSON object (no markdown, no explanation):
{
  "connectRate": <percentage as number 0-100>,
  "interestDistribution": {
    "INTERESTED": <count>,
    "NOT_INTERESTED": <count>,
    "CALLBACK": <count>,
    "NO_ANSWER": <count>,
    "FAILED": <count>
  },
  "topObjections": ["<most common objection 1>", "<objection 2>", "<objection 3>"],
  "scriptImprovements": [
    "<concrete script improvement 1>",
    "<concrete script improvement 2>",
    "<concrete script improvement 3>"
  ],
  "summary": "<3-4 sentence executive summary of how the campaign went and what to do next>"
}`;

  async function attempt(): Promise<BatchRollup> {
    const msg = await client.messages.create({
      model: SONNET,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = RollupSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) throw new Error("Schema mismatch: " + parsed.error.message);
    return parsed.data;
  }

  try {
    return await attempt();
  } catch {
    return await attempt();
  }
}
