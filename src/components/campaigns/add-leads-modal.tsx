"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CsvUploadStep } from "./csv-upload-step";
import { ColumnMappingStep } from "./column-mapping-step";
import type { ParsedRow, MappedLead } from "./new-campaign-wizard";

interface Props {
  campaignId: string;
}

export function AddLeadsModal({ campaignId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "map">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("upload");
      setHeaders([]);
      setRows([]);
    }
  }

  function handleParsed(h: string[], r: ParsedRow[]) {
    setHeaders(h);
    setRows(r);
    setStep("map");
  }

  async function handleImport(leads: MappedLead[]) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          leads: leads.map((l) => ({
            name: l.name,
            phone: l.phone,
            context: l.context,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success(
        `${data.created} lead${data.created !== 1 ? "s" : ""} added${data.skipped > 0 ? ` · ${data.skipped} skipped` : ""}`
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
        <UserPlus className="h-4 w-4" />
        Add Leads
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? "Upload Leads CSV" : "Map Columns"}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" ? (
          <CsvUploadStep
            onParsed={handleParsed}
            onBack={() => setOpen(false)}
          />
        ) : (
          <ColumnMappingStep
            headers={headers}
            rows={rows}
            onDone={handleImport}
            onBack={() => setStep("upload")}
            submitting={submitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
