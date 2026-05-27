import { VapiClient as VapiSDK } from "@vapi-ai/server-sdk";
import { HAIKU } from "@/lib/anthropic/client";
import type { TelephonyProvider, PlaceCallParams, PlaceCallResult } from "./interface";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class VapiProvider implements TelephonyProvider {
  private client: VapiSDK;
  private resolvedPhoneNumberId: string | null = null;

  constructor() {
    if (!process.env.VAPI_API_KEY) throw new Error("VAPI_API_KEY is not set");
    this.client = new VapiSDK({ token: process.env.VAPI_API_KEY });
  }

  /**
   * Resolves VAPI_PHONE_NUMBER_ID to a UUID.
   * Accepts either a UUID directly or a phone number string like "+1 (689) 306 9270" —
   * in the latter case, lists phone numbers from Vapi and finds the matching one.
   */
  private async resolvePhoneNumberId(): Promise<string> {
    if (this.resolvedPhoneNumberId) return this.resolvedPhoneNumberId;

    const configured = process.env.VAPI_PHONE_NUMBER_ID;
    if (!configured) throw new Error("VAPI_PHONE_NUMBER_ID is not set");

    // Already a UUID — use it directly
    if (UUID_RE.test(configured.trim())) {
      this.resolvedPhoneNumberId = configured.trim();
      return this.resolvedPhoneNumberId;
    }

    // Looks like a phone number string — look up its UUID
    const normalized = configured.replace(/\s|\(|\)|-/g, "");
    const phoneNumbers = await this.client.phoneNumbers.list();

    const match = phoneNumbers.find((pn) => {
      const num = (pn as { number?: string }).number ?? "";
      return num.replace(/\s|\(|\)|-/g, "") === normalized;
    });

    if (!match) {
      const available = phoneNumbers
        .map((pn) => `${(pn as { number?: string }).number ?? "?"} (id: ${(pn as { id?: string }).id ?? "?"})`)
        .join(", ");
      throw new Error(
        `Phone number "${configured}" not found in your Vapi account. ` +
        `Available numbers: ${available || "none"}. ` +
        `Set VAPI_PHONE_NUMBER_ID to one of the UUIDs listed above.`
      );
    }

    this.resolvedPhoneNumberId = (match as { id: string }).id;
    console.log(`[vapi] resolved phone number "${configured}" → UUID ${this.resolvedPhoneNumberId}`);
    return this.resolvedPhoneNumberId;
  }

  async placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
    const { phone, name, systemPrompt, campaignId, leadId, webhookUrl } = params;

    const phoneNumberId = await this.resolvePhoneNumberId();

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
        },
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

let _provider: VapiProvider | null = null;

export function getVapiProvider(): VapiProvider {
  if (!_provider) _provider = new VapiProvider();
  return _provider;
}
