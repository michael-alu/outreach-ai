/**
 * Run with: npx tsx scripts/check-vapi-numbers.ts
 * Lists all phone numbers in your Vapi account with their UUIDs.
 */
import "dotenv/config";
import { VapiClient } from "@vapi-ai/server-sdk";

async function main() {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    console.error("VAPI_API_KEY is not set in .env");
    process.exit(1);
  }

  const client = new VapiClient({ token: apiKey });
  const numbers = await client.phoneNumbers.list();

  if (!numbers.length) {
    console.log("No phone numbers found in your Vapi account.");
    console.log("Import a Twilio number at: https://dashboard.vapi.ai/phone-numbers");
    return;
  }

  console.log(`\nFound ${numbers.length} phone number(s):\n`);
  for (const pn of numbers) {
    const n = pn as Record<string, unknown>;
    console.log(`  Number : ${n.number ?? "—"}`);
    console.log(`  UUID   : ${n.id ?? "—"}`);
    console.log(`  Name   : ${n.name ?? "—"}`);
    console.log(`  Provider: ${n.provider ?? "—"}`);
    console.log();
  }

  console.log(`Set in .env:\n  VAPI_PHONE_NUMBER_ID=<UUID from above>`);
}

main().catch(console.error);
