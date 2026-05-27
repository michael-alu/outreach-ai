"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PitchConfigStep } from "./pitch-config-step";
import { CsvUploadStep } from "./csv-upload-step";
import { ColumnMappingStep } from "./column-mapping-step";
import type { ProductInfo } from "@/lib/types";

export type ParsedRow = Record<string, string>;

export interface MappedLead {
  name: string;
  phone: string;
  context: Record<string, string>;
}

type Step = "pitch" | "upload" | "mapping";

const STEPS: Step[] = ["pitch", "upload", "mapping"];
const STEP_LABELS: Record<Step, string> = {
  pitch: "Pitch Config",
  upload: "Upload CSV",
  mapping: "Map Columns",
};

export function NewCampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pitch");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  async function handlePitchDone(data: { name: string; productInfo: ProductInfo }) {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const campaign = await res.json();
      setCampaignId(campaign.id);
      setProductInfo(data.productInfo);
      setStep("upload");
    } catch {
      toast.error("Failed to create campaign");
    }
  }

  function handleCsvParsed(headers: string[], rows: ParsedRow[]) {
    setCsvHeaders(headers);
    setCsvRows(rows);
    setStep("mapping");
  }

  async function handleMappingDone(leads: MappedLead[]) {
    if (!campaignId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, leads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      if (data.skipped > 0) {
        toast.warning(`${data.skipped} lead(s) skipped — invalid phone numbers`);
      }
      toast.success(`${data.created} lead${data.created !== 1 ? "s" : ""} imported`);
      router.push(`/campaigns/${campaignId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-mono font-semibold transition-colors ${
                i < stepIndex
                  ? "bg-primary text-primary-foreground"
                  : i === stepIndex
                  ? "bg-primary/20 text-primary ring-1 ring-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === stepIndex ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 ${i < stepIndex ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {step === "pitch" && <PitchConfigStep onDone={handlePitchDone} />}
          {step === "upload" && (
            <CsvUploadStep onParsed={handleCsvParsed} onBack={() => setStep("pitch")} />
          )}
          {step === "mapping" && (
            <ColumnMappingStep
              headers={csvHeaders}
              rows={csvRows}
              onDone={handleMappingDone}
              onBack={() => setStep("upload")}
              submitting={submitting}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
