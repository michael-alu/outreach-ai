"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ParsedRow } from "./new-campaign-wizard";

interface Props {
  onParsed: (headers: string[], rows: ParsedRow[]) => void;
  onBack: () => void;
}

export function CsvUploadStep({ onParsed, onBack }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);

  const parseFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }
    setFileName(file.name);
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length && !results.data.length) {
          setError("Could not parse CSV: " + results.errors[0].message);
          return;
        }
        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          setError("CSV has no columns");
          return;
        }
        setPreview({ headers, rows: results.data });
      },
      error(err) {
        setError(err.message);
      },
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  return (
    <div className="space-y-5">
      <Card
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed transition-colors cursor-pointer",
          dragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-border",
          preview ? "border-primary/40 bg-primary/5" : ""
        )}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
        {preview ? (
          <>
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {preview.rows.length} row{preview.rows.length !== 1 ? "s" : ""} · {preview.headers.length} columns
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={(e) => { e.stopPropagation(); setPreview(null); setFileName(null); }}
            >
              Replace file
            </button>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-sm">Drop your CSV here</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                or click to browse · max 500 leads
              </p>
            </div>
          </>
        )}
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {preview && (
        <Card className="border-border/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60">
            <p className="text-xs font-medium text-muted-foreground">Preview (first 3 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60">
                  {preview.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-muted-foreground font-mono truncate max-w-[160px]">
                        {row[h] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          disabled={!preview}
          onClick={() => preview && onParsed(preview.headers, preview.rows)}
          className="gap-2"
        >
          Next: Map Columns
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
