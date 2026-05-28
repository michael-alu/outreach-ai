import { VapiClient as VapiSDK } from "@vapi-ai/server-sdk";
import { HAIKU } from "@/lib/anthropic/client";
import type { TelephonyProvider, PlaceCallParams, PlaceCallResult } from "./interface";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizePhone(phone: string): string {
  return phone.replace(/[\s()\-]/g, "");
}

function isUSNumber(phone: string): boolean {
  return normalizePhone(phone).startsWith("+1");
}

function isRwandanNumber(phone: string): boolean {
  return normalizePhone(phone).startsWith("+250");
}

export class VapiProvider implements TelephonyProvider {
  private client: VapiSDK;

  constructor() {
    if (!process.env.VAPI_API_KEY) throw new Error("VAPI_API_KEY is not set");
    this.client = new VapiSDK({ token: process.env.VAPI_API_KEY });
  }

  private getPhoneNumberId(destinationPhone: string): string {
    if (isUSNumber(destinationPhone)) {
      const id = process.env.VAPI_PHONE_NUMBER_ID;
      if (!id) throw new Error("VAPI_PHONE_NUMBER_ID is not set (required for US +1 numbers)");
      if (!UUID_RE.test(id.trim())) throw new Error(`VAPI_PHONE_NUMBER_ID is not a valid UUID: ${id}`);
      console.log(`[vapi] routing +1 number via free Vapi phone number ID ${id}`);
      return id.trim();
    }

    if (isRwandanNumber(destinationPhone)) {
      const id = process.env.VAPI_TWILIO_PHONE_NUMBER_ID;
      if (!id) throw new Error("VAPI_TWILIO_PHONE_NUMBER_ID is not set (required for Rwanda +250 numbers)");
      if (!UUID_RE.test(id.trim())) throw new Error(`VAPI_TWILIO_PHONE_NUMBER_ID is not a valid UUID: ${id}`);
      console.log(`[vapi] routing +250 number via Twilio phone number ID ${id}`);
      return id.trim();
    }

    throw new Error(
      `Unsupported phone number: "${destinationPhone}". ` +
      `Only US (+1) and Rwanda (+250) numbers are currently supported.`
    );
  }

  async placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
    const { phone, name, systemPrompt, campaignId, leadId, webhookUrl } = params;

    const phoneNumberId = this.getPhoneNumberId(phone);

    // §5.3 — Claude Haiku as the in-call conversation model
    // §5.4 — Tool use: agent can invoke these during the call
    const call = await this.client.calls.create({
      phoneNumberId,
      customer: {
        number: phone,
        name,
      },
      assistant: {
        model: {
          provider: "anthropic",
          model: HAIKU,
          messages: [{ role: "system", content: systemPrompt }],
          // §5.4 in-call tools
          tools: [
            {
              type: "function",
              function: {
                name: "lookup_price",
                description: "Look up current pricing and available payment plans for the product",
                parameters: {
                  type: "object",
                  properties: {
                    plan: {
                      type: "string",
                      description: "The payment plan to look up (e.g. 'weekly', 'monthly', 'upfront')",
                    },
                  },
                  required: [],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "check_availability",
                description: "Check product availability and delivery timeline in a given location",
                parameters: {
                  type: "object",
                  properties: {
                    location: {
                      type: "string",
                      description: "The location to check availability for",
                    },
                  },
                  required: ["location"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "flag_interested",
                description: "Flag the lead's interest level based on the conversation",
                parameters: {
                  type: "object",
                  properties: {
                    level: {
                      type: "number",
                      description: "Interest level from 0 (not interested) to 100 (very interested)",
                    },
                    notes: {
                      type: "string",
                      description: "Brief notes on why this level was assigned",
                    },
                  },
                  required: ["level"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "schedule_callback",
                description: "Schedule a callback for a lead who wants to be called back later",
                parameters: {
                  type: "object",
                  properties: {
                    preferredTime: {
                      type: "string",
                      description: "The lead's preferred callback time (e.g. 'tomorrow afternoon', 'Thursday 3pm')",
                    },
                    notes: {
                      type: "string",
                      description: "Any notes about what to discuss on the callback",
                    },
                  },
                  required: ["preferredTime"],
                },
              },
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
          stability: 0.4,         // lower = more natural variation, less robotic
          similarityBoost: 0.8,
          style: 0.35,            // some expressiveness
          useSpeakerBoost: true,
          optimizeStreamingLatency: 4,
        },
        // Yield immediately when the lead cuts in
        stopSpeakingPlan: {
          numWords: 0,
          voiceSeconds: 0.2,
          backoffSeconds: 0.5,
        },
        // Tiny pause so it doesn't sound instant-bot, but not slow
        responseDelaySeconds: 0.1,
        serverUrl: webhookUrl,
        metadata: { leadId, campaignId },
      },
    } as Parameters<typeof this.client.calls.create>[0]);

    // CreateCallsResponse is Call | CallBatchResponse; narrow to single Call
    const singleCall = "id" in call ? call : (call as { calls?: { id: string; status?: string }[] }).calls?.[0];
    if (!singleCall?.id) throw new Error("Vapi did not return a call ID");

    return {
      vapiCallId: singleCall.id,
      status: (singleCall as { status?: string }).status ?? "queued",
    };
  }
}

export function getVapiProvider(): VapiProvider {
  return new VapiProvider();
}
