import { NewCampaignWizard } from "@/components/campaigns/new-campaign-wizard";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold">New Campaign</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your pitch, upload leads, and let Claude do the rest.
        </p>
      </div>
      <NewCampaignWizard />
    </div>
  );
}
