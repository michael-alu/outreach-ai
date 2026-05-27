"use client";

import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import type { ProductInfo } from "@/lib/types";

interface Props {
  onDone: (data: { name: string; productInfo: ProductInfo }) => Promise<void>;
}

export function PitchConfigStep({ onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cta, setCta] = useState("");
  const [language, setLanguage] = useState("English");
  const [valueProps, setValueProps] = useState<string[]>(["", ""]);
  const [objections, setObjections] = useState<string[]>(["", ""]);

  function addItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }
  function removeItem(setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) {
    setter((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    i: number,
    v: string
  ) {
    setter((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onDone({
        name: campaignName,
        productInfo: {
          name: productName,
          description,
          price,
          cta,
          language,
          valueProps: valueProps.filter(Boolean),
          objections: objections.filter(Boolean),
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-5 border-border/60 space-y-4">
        <h3 className="text-sm font-semibold">Campaign</h3>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign name</Label>
          <Input
            id="campaign-name"
            placeholder="e.g. Rwanda Solar Q3"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            required
          />
        </div>
      </Card>

      <Card className="p-5 border-border/60 space-y-4">
        <h3 className="text-sm font-semibold">Product</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              placeholder="e.g. SolarHome 200"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Price / plan</Label>
            <Input
              id="price"
              placeholder="e.g. RWF 3,500/week"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Briefly describe what the product does and who it's for…"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cta">Call-to-action</Label>
          <Input
            id="cta"
            placeholder="e.g. Schedule a free demo installation this week"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="language">Agent language</Label>
          <Input
            id="language"
            placeholder="English"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-5 border-border/60 space-y-4">
        <h3 className="text-sm font-semibold">Value Propositions</h3>
        {valueProps.map((vp, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder={`Value prop ${i + 1}`}
              value={vp}
              onChange={(e) => updateItem(setValueProps, i, e.target.value)}
            />
            {valueProps.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(setValueProps, i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addItem(setValueProps)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add value prop
        </button>
      </Card>

      <Card className="p-5 border-border/60 space-y-4">
        <h3 className="text-sm font-semibold">Common Objections & Responses</h3>
        {objections.map((obj, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder={`Objection ${i + 1} (Claude will handle these)`}
              value={obj}
              onChange={(e) => updateItem(setObjections, i, e.target.value)}
            />
            {objections.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(setObjections, i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addItem(setObjections)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add objection
        </button>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? "Creating…" : "Next: Upload CSV"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
