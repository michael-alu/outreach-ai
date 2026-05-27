import { z } from "zod";
import { getAnthropicClient, SONNET } from "./client";
import type { CallAnalysis } from "@/lib/types";

const CallAnalysisSchema = z.object({
  outcome: z.enum(["INTERESTED", "NOT_INTERESTED", "CALLBACK", "NO_ANSWER", "FAILED"]),
  interestScore: z.number().int().min(0).max(100),
  objections: z.array(z.string()),
  summary: z.string(),
  nextStep: z.string(),
  followUpDraft: z.string(),
});

/** §5.5 — Post-call transcript analysis */
export async function analyzeTranscript(transcript: string): Promise<CallAnalysis> {
  const client = getAnthropicClient();

  const prompt = `You are a sales call analyst. Analyze this AI sales call transcript and return a JSON analysis.

TRANSCRIPT:
${transcript}

Return ONLY a JSON object with exactly these fields (no markdown, no explanation):
{
  "outcome": "INTERESTED" | "NOT_INTERESTED" | "CALLBACK" | "NO_ANSWER" | "FAILED",
  "interestScore": <integer 0-100>,
  "objections": ["<objection 1>", ...],
  "summary": "<2-3 sentence summary of how the call went>",
  "nextStep": "<single recommended next action>",
  "followUpDraft": "<draft SMS or short email follow-up message to send the lead>"
}`;

  async function attempt(): Promise<CallAnalysis> {
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

    const parsed = CallAnalysisSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) throw new Error("Schema mismatch: " + parsed.error.message);
    return parsed.data;
  }

  try {
    return await attempt();
  } catch {
    return await attempt();
  }
}
