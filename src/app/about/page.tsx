import {
  ShieldCheck,
  Sparkles,
  Globe,
  Lock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">About outreach</h2>
        <p className="text-muted-foreground leading-relaxed text-base">
          Outreach is an AI-powered calling platform that helps small businesses
          and entrepreneurs in Rwanda — and across Africa — run professional
          outbound sales campaigns without the cost of a call center. It was
          built during a 72-hour hackathon, but its ambitions stretch much
          further.
        </p>
      </div>

      {/* Inspiration */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          The Inspiration
        </h3>
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
          <Sparkles className="absolute right-5 top-5 h-4 w-4 text-primary/40" />
          <blockquote className="text-sm leading-relaxed text-foreground/80 italic">
            "if AI further increases economic growth and quality of life in the
            developed world, while doing little to help the developing world, we
            should view that as a{" "}
            <span className="text-foreground font-medium not-italic">
              terrible moral failure
            </span>
            ."
          </blockquote>
          <p className="mt-3 text-xs text-muted-foreground">
            — Dario Amodei,{" "}
            <span className="text-primary">Machines of Loving Grace</span>
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Dario Amodei's essay argues that AI has the potential to compress
            50–100 years of human progress into the next decade — and that this
            benefit must reach everyone, not just the already-wealthy. GDP per
            capita in Sub-Saharan Africa sits at roughly $2,000 compared to
            $75,000 in the United States. That gap isn't inevitable.
          </p>
          <p>
            outreach exists to close a small but real slice of that gap: giving
            a Rwandan entrepreneur the same outbound sales capability that a
            well-funded startup in San Francisco has taken for granted for
            years. One conversation at a time.
          </p>
        </div>
      </div>

      {/* How Claude powers this */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          How Claude Powers This
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Personalised Pitch",
              body: "Claude reads each lead's context and writes a unique system prompt — tailoring the tone, angle, and language to that specific person before the call begins.",
            },
            {
              step: "02",
              title: "Call Analysis",
              body: "After every call, Claude scores interest, extracts objections, recommends a next step, and drafts a follow-up message — instantly.",
            },
            {
              step: "03",
              title: "Campaign Rollup",
              body: "Claude synthesises all call outcomes into a strategic brief: what's working, what objections keep surfacing, and where to focus next.",
            },
          ].map(({ step, title, body }) => (
            <Card key={step} className="p-4 border-border/60 space-y-2">
              <p className="font-mono text-xs text-primary/60">{step}</p>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Current safeguards */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          How We Protect People — Today
        </h3>
        <div className="space-y-3">
          {[
            {
              icon: ShieldCheck,
              title: "Explicit consent required before every import",
              body: "Users must confirm — by checkbox — that every person in their lead list has explicitly agreed to be contacted, whether through a T&C tick-box, an opt-in form, or a job application. The upload is blocked until this is acknowledged.",
            },
            {
              icon: AlertTriangle,
              title: "The AI stops when asked",
              body: 'If a lead says anything like "I have to go", "not interested", or "stop calling", the AI agent is instructed to acknowledge warmly, thank them, and end the call immediately — no further pitch, no persistence.',
            },
            {
              icon: Lock,
              title: "No secrets on the client",
              body: "All calls to Claude and Vapi happen server-side. API keys never reach the browser. All AI output is schema-validated before being stored or acted on.",
            },
            {
              icon: Globe,
              title: "Local compliance framing",
              body: "The consent language explicitly references GDPR, Nigeria's NDPR, and Rwanda's Data Protection Law — because outreach is built for African markets and takes local regulation seriously.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post-hackathon roadmap */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          What's Coming — The Full Vision
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The current build is a hackathon prototype. The production version
          will add a layer of institutional accountability that a 72-hour
          project can't yet provide:
        </p>
        <div className="space-y-3">
          {[
            {
              icon: UserCheck,
              title: "Business verification before access",
              body: "Every business that signs up will go through a verification step — registered company name, tax ID or RDB number, and a review of their use case. The platform will not be open to anonymous users.",
            },
            {
              icon: ShieldCheck,
              title: "User accounts with audit trails",
              body: "A full sign-up flow will tie every campaign and every call to a verified individual. Misuse can be traced, reported, and acted on. Repeat violators will be removed.",
            },
            {
              icon: Globe,
              title: "Consent audit log",
              body: "The platform will record and store the consent confirmation at import time — who confirmed it, when, and for which leads — so businesses can demonstrate compliance if ever audited.",
            },
            {
              icon: Lock,
              title: "Opt-out registry integration",
              body: "Leads who say they don't want to be called will be added to a do-not-call list that persists across campaigns. A business will not be able to re-add them.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-lg border border-border/40 border-dashed bg-card/20 px-4 py-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/80">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing */}
      <div className="rounded-xl border border-border/40 bg-card/30 px-6 py-5 text-sm text-muted-foreground leading-relaxed space-y-2">
        <p>
          AI does not make exploitation more ethical. It makes everything faster
          — including harm, if the wrong people use it the wrong way. That's why
          we think seriously about who gets access and on what terms.
        </p>
        <p>
          The goal isn't just a working product. It's a tool that{" "}
          <span className="text-foreground font-medium">earns the trust</span>{" "}
          of the people it calls, the businesses that use it, and the regulators
          who will eventually govern it.
        </p>
      </div>
    </div>
  );
}
