/** Server-side handlers for in-call tool calls (§5.4) */

export interface ToolResult {
  result: string;
}

export async function handleToolCall(
  toolName: string,
  parameters: Record<string, unknown>,
  _leadId: string
): Promise<ToolResult> {
  switch (toolName) {
    case "lookup_price": {
      const plan = (parameters.plan as string) ?? "weekly";
      // In production: fetch from your pricing DB / API
      const plans: Record<string, string> = {
        weekly: "RWF 3,500 per week with a 6-month minimum commitment",
        monthly: "RWF 13,000 per month — save 7% vs weekly",
        upfront: "RWF 120,000 one-time — save 35% vs weekly over 1 year",
      };
      const price = plans[plan.toLowerCase()] ?? plans.weekly;
      return { result: `Pricing for ${plan} plan: ${price}. All plans include 12-month warranty and free installation.` };
    }

    case "check_availability": {
      const location = (parameters.location as string) ?? "your area";
      // In production: check inventory/delivery API
      return {
        result: `SolarHome 200 is available in ${location}. We can have an installation team there within 3–5 business days. Demo visits can be scheduled within 48 hours.`,
      };
    }

    case "flag_interested": {
      const level = parameters.level as number;
      const notes = (parameters.notes as string) ?? "";
      // This is handled at transcript analysis time; acknowledge the flag
      return {
        result: `Noted. Interest level ${level}/100 flagged${notes ? `: ${notes}` : ""}. This will be recorded for follow-up prioritization.`,
      };
    }

    case "schedule_callback": {
      const time = (parameters.preferredTime as string) ?? "a time to be confirmed";
      const notes = (parameters.notes as string) ?? "";
      return {
        result: `Callback scheduled for ${time}. ${notes ? `Notes: ${notes}. ` : ""}Our team will call from the same number. You'll receive an SMS confirmation shortly.`,
      };
    }

    default:
      return { result: `Tool "${toolName}" is not available.` };
  }
}
