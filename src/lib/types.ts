export type LeadStatus =
  | "NEW"
  | "ENRICHED"
  | "QUEUED"
  | "RINGING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_ANSWER"
  | "FAILED";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";

export interface ProductInfo {
  name: string;
  description: string;
  valueProps: string[];
  price: string;
  objections: string[];
  cta: string;
  language: string;
}

export interface LeadContext {
  [key: string]: string | number | boolean | undefined;
}

export interface CallAnalysis {
  outcome: "INTERESTED" | "NOT_INTERESTED" | "CALLBACK" | "NO_ANSWER" | "FAILED";
  interestScore: number; // 0-100
  objections: string[];
  summary: string;
  nextStep: string;
  followUpDraft: string;
}

export interface EnrichmentResult {
  leads: Array<{
    id: string;
    priorityRank: number;
    angle: string;
  }>;
}

export interface BatchRollup {
  connectRate: number;
  interestDistribution: Record<string, number>;
  topObjections: string[];
  scriptImprovements: string[];
  summary: string;
}
