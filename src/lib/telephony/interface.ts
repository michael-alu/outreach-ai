export interface PlaceCallParams {
  leadId: string;
  name: string;
  phone: string;
  systemPrompt: string;
  campaignId: string;
  webhookUrl: string;
}

export interface PlaceCallResult {
  vapiCallId: string;
  status: string;
}

export interface TelephonyProvider {
  placeCall(params: PlaceCallParams): Promise<PlaceCallResult>;
}

export interface WebhookPayload {
  type: "call-started" | "call-ended" | "transcript" | "tool-call" | string;
  call?: {
    id: string;
    status: string;
    startedAt?: string;
    endedAt?: string;
    recordingUrl?: string;
  };
  transcript?: string;
  toolCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}
