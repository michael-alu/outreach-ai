"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { isValidRwandaPhone, normalizeRwandaPhone } from "@/lib/phone";
import type { ParsedRow, MappedLead } from "./new-campaign-wizard";

interface Props {
  headers: string[];
  rows: ParsedRow[];
  onDone: (leads: MappedLead[]) => Promise<void>;
  onBack: () => void;
  submitting: boolean;
}

function autoDetect(headers: string[], key: string): string {
  const lower = headers.map((h) => h.toLowerCase());
  if (key === "name") {
    const idx = lower.findIndex((h) => h.includes("name") || h === "full name");
    return idx >= 0 ? headers[idx] : "";
  }
  if (key === "phone") {
    const idx = lower.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("tel"));
    return idx >= 0 ? headers[idx] : "";
  }
  return "";
}

export function ColumnMappingStep({ headers, rows, onDone, onBack, submitting }: Props) {
  const [nameCol, setNameCol] = useState(() => autoDetect(headers, "name"));
  const [phoneCol, setPhoneCol] = useState(() => autoDetect(headers, "phone"));

  const contextCols = headers.filter((h) => h !== nameCol && h !== phoneCol);

  const { valid, invalid } = useMemo(() => {
    let valid = 0, invalid = 0;
    for (const row of rows) {
      const phone = row[phoneCol] ?? "";
      isValidRwandaPhone(phone) ? valid++ : invalid++;
    }
    return { valid, invalid };
  }, [rows, phoneCol]);

  const mapped = useMemo<MappedLead[]>(() => {
    return rows
      .filter((row) => isValidRwandaPhone(row[phoneCol] ?? ""))
      .map((row) => ({
        name: row[nameCol] ?? "Unknown",
        phone: normalizeRwandaPhone(row[phoneCol] ?? "") ?? "",
        context: Object.fromEntries(
          contextCols.map((c) => [c, row[c] ?? ""])
        ),
      }));
  }, [rows, nameCol, phoneCol, contextCols]);

  return (
    <div className="space-y-5">
      <Card className="p-5 border-border/60 space-y-4">
        <h3 className="text-sm font-semibold">Map Required Columns</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name column</Label>
            <select
              value={nameCol}
              onChange={(e) => setNameCol(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Phone column</Label>
            <select
              value={phoneCol}
              onChange={(e) => setPhoneCol(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {contextCols.length > 0 && (
          <p className="text-xs text-muted-foreground">
            All other columns ({contextCols.join(", ")}) will be stored as lead context for Claude.
          </p>
        )}
      </Card>

      {phoneCol && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="font-mono font-semibold">{valid}</span>
            <span className="text-muted-foreground">valid +250 numbers</span>
          </div>
          {invalid > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-mono font-semibold">{invalid}</span>
              <span className="text-muted-foreground">will be skipped</span>
            </div>
          )}
        </div>
      )}

      {mapped.length > 0 && (
        <Card className="border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60">
            <p className="text-xs font-medium text-muted-foreground">Preview (first 3 leads)</p>
          </div>
          <div className="divide-y divide-border/40">
            {mapped.slice(0, 3).map((lead, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{lead.phone}</p>
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {Object.entries(lead.context)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5" disabled={submitting}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          disabled={!nameCol || !phoneCol || valid === 0 || submitting}
          onClick={() => onDone(mapped)}
          className="gap-2"
        >
          {submitting ? "Importing…" : `Import ${valid} Lead${valid !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
