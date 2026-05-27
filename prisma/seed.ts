import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: path.resolve(process.cwd(), "./dev.db"),
});
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const campaign = await db.campaign.upsert({
    where: { id: "demo-campaign-1" },
    update: {},
    create: {
      id: "demo-campaign-1",
      name: "Rwanda Solar Demo",
      status: "DRAFT",
      productInfo: JSON.stringify({
        name: "SolarHome 200",
        description:
          "Affordable solar home system — powers lights, phone charging, and a small TV for 3+ years on a pay-as-you-go plan.",
        valueProps: [
          "No electricity bills",
          "Works during load shedding",
          "12-month warranty",
          "Pay weekly via MoMo",
        ],
        price: "RWF 3,500 / week (pay-as-you-go)",
        objections: [
          "Too expensive — offer the weekly plan",
          "Already have RECO — highlight reliability and off-grid areas",
          "Need to think — offer a free demo install",
        ],
        cta: "Schedule a free demo installation this week",
        language: "English",
      }),
      leads: {
        create: [
          {
            id: "lead-1",
            name: "Amina Uwimana",
            phone: "+250788100001",
            context: JSON.stringify({
              location: "Musanze",
              occupation: "Small business owner",
              notes: "Runs a salon, interested in reliable power",
            }),
            status: "NEW",
          },
          {
            id: "lead-2",
            name: "Jean-Paul Nzeyimana",
            phone: "+250788100002",
            context: JSON.stringify({
              location: "Huye",
              occupation: "Teacher",
              notes: "Has kids, wants to help them study at night",
            }),
            status: "NEW",
          },
          {
            id: "lead-3",
            name: "Claudine Mukamana",
            phone: "+250788100003",
            context: JSON.stringify({
              location: "Kicukiro, Kigali",
              occupation: "Nurse",
              notes: "Frequent load shedding in her area",
            }),
            status: "ENRICHED",
            priorityRank: 1,
            angle:
              "A nurse dealing with frequent load shedding will immediately understand the value of reliable off-grid power — lead with the reliability story and the weekly MoMo payment option.",
          },
          {
            id: "lead-4",
            name: "Emmanuel Habimana",
            phone: "+250788100004",
            context: JSON.stringify({
              location: "Rubavu",
              occupation: "Hotel owner",
              notes: "Wants to cut generator costs",
            }),
            status: "COMPLETED",
            priorityRank: 2,
            angle:
              "A hotel owner already spending on diesel should hear the total-cost comparison. Frame SolarHome 200 as an ROI play, not a charity pitch.",
          },
        ],
      },
    },
    include: { leads: true },
  });

  await db.call.upsert({
    where: { id: "demo-call-1" },
    update: {},
    create: {
      id: "demo-call-1",
      leadId: "lead-4",
      status: "COMPLETED",
      startedAt: new Date(Date.now() - 1000 * 60 * 8),
      endedAt: new Date(Date.now() - 1000 * 60 * 3),
      transcript:
        "Agent: Hello, this is an AI assistant calling on behalf of SolarHome. Am I speaking with Emmanuel?\nLead: Yes, speaking.\nAgent: Great! I wanted to share how our SolarHome 200 system can help cut your generator costs at the hotel...\nLead: How much does it cost?\nAgent: It's RWF 3,500 per week on a pay-as-you-go plan — typically a third of what a week of diesel costs.\nLead: That's interesting. Can you send someone to discuss in person?\nAgent: Absolutely! I'll have our team schedule a free demo visit. Does Thursday work?\nLead: Thursday afternoon is fine.\nAgent: Perfect, we'll confirm by SMS. Thank you, Emmanuel!",
      analysis: JSON.stringify({
        outcome: "INTERESTED",
        interestScore: 82,
        objections: ["Cost concern (resolved with weekly plan comparison)"],
        summary:
          "Emmanuel was receptive. Main concern was cost — resolved by framing against diesel spend. Agreed to an in-person demo visit Thursday afternoon.",
        nextStep: "Schedule demo visit for Thursday afternoon",
        followUpDraft:
          "Hi Emmanuel, thanks for your time today! Our team will visit Thursday afternoon to give you a free SolarHome 200 demo at your hotel. We'll call to confirm the exact time. — SolarHome Rwanda",
      }),
    },
  });

  console.log(
    `✓ Seeded campaign "${campaign.name}" with ${campaign.leads.length} leads`
  );
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
