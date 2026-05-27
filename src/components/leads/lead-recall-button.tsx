"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  leadId: string;
  leadName: string;
}

export function LeadRecallButton({ leadId, leadName }: Props) {
  const router = useRouter();
  const [recalling, setRecalling] = useState(false);

  async function handleRecall() {
    setRecalling(true);
    const t = toast.loading(`Calling ${leadName}…`);
    try {
      const res = await fetch(`/api/leads/${leadId}/recall`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Recall failed");
      toast.success("Call placed — check back shortly for status updates", { id: t, duration: 5000 });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recall failed", { id: t });
    } finally {
      setRecalling(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRecall}
      disabled={recalling}
      className="gap-2"
    >
      {recalling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
      {recalling ? "Calling…" : "Recall"}
    </Button>
  );
}
