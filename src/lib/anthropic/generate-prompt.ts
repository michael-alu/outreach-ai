import { getAnthropicClient, SONNET } from "./client";
import type { ProductInfo } from "@/lib/types";

export async function generateCallPrompt(
  lead: { name: string; phone: string; angle: string | null; context: string },
  productInfo: ProductInfo
): Promise<string> {
  const client = getAnthropicClient();

  const contextObj = (() => {
    try { return JSON.parse(lead.context); } catch { return {}; }
  })();

  const contextText = Object.entries(contextObj)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ") || "No additional context";

  const prompt = `You are a prompt engineer for AI voice sales agents. Write a concise, high-converting system prompt for an AI voice agent that will call ${lead.name} about ${productInfo.name}.

PRODUCT:
- Name: ${productInfo.name}
- Description: ${productInfo.description}
- Value props: ${productInfo.valueProps.join("; ")}
- Price: ${productInfo.price}
- CTA: ${productInfo.cta}
- Language: ${productInfo.language}

LEAD:
- Name: ${lead.name}
- Context: ${contextText}
- Tailored angle: ${lead.angle ?? "No specific angle — use general pitch"}

Write a system prompt for the voice agent that includes:
1. A personalized opening line referencing the lead's context
2. Which value props to emphasize for this specific lead
3. How to handle likely objections based on the lead's context
4. The desired CTA and how to close
5. Instructions to keep the call under 3 minutes and be conversational, not scripted
6. A required AI disclosure: start by saying "I'm an AI assistant calling on behalf of [company]"
7. Clear exit-signal rules: if the lead says anything like "I have to go", "I'm busy", "not interested", "goodbye", "stop calling", or otherwise signals they want to end — acknowledge warmly, thank them for their time, and end the call immediately without any further pitch. Never re-engage after an exit signal. Respecting the lead's time is non-negotiable.

Return ONLY the system prompt text — no explanation, no labels.`;

  const msg = await client.messages.create({
    model: SONNET,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")
    .trim();
}
