"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  campaignId: string;
}

export function RollupTrigger({ campaignId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRollup() {
    setLoading(true);
    const t = toast.loading("Claude is analyzing campaign results…");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/rollup`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rollup failed");
      toast.success("Campaign analysis complete", { id: t });
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rollup failed", { id: t });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRollup}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
      Generate Rollup
    </Button>
  );
}
