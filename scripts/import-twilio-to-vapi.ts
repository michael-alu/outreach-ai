/**
 * Imports your Twilio phone number into Vapi so it can be used for outbound calls,
 * including international numbers like Rwanda (+250).
 *
 * Run with: npx tsx scripts/import-twilio-to-vapi.ts
 * Then update VAPI_PHONE_NUMBER_ID in .env with the UUID printed below.
 */
import "dotenv/config";
import { VapiClient } from "@vapi-ai/server-sdk";

async function main() {
  const { VAPI_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
    process.env;

  if (!VAPI_API_KEY) { console.error("Missing VAPI_API_KEY"); process.exit(1); }
  if (!TWILIO_ACCOUNT_SID) { console.error("Missing TWILIO_ACCOUNT_SID"); process.exit(1); }
  if (!TWILIO_AUTH_TOKEN) { console.error("Missing TWILIO_AUTH_TOKEN"); process.exit(1); }
  if (!TWILIO_PHONE_NUMBER) { console.error("Missing TWILIO_PHONE_NUMBER"); process.exit(1); }

  const client = new VapiClient({ token: VAPI_API_KEY });

  // Check if it's already imported
  const existing = await client.phoneNumbers.list();
  const alreadyImported = existing.find((pn) => {
    const n = pn as Record<string, unknown>;
    const num = (n.number as string ?? "").replace(/\D/g, "");
    return num === TWILIO_PHONE_NUMBER.replace(/\D/g, "");
  });

  if (alreadyImported) {
    const n = alreadyImported as Record<string, unknown>;
    console.log(`\nTwilio number already imported in Vapi.`);
    console.log(`  Number : ${n.number}`);
    console.log(`  UUID   : ${n.id}`);
    console.log(`\nSet in .env:\n  VAPI_PHONE_NUMBER_ID=${n.id}`);
    return;
  }

  console.log(`Importing ${TWILIO_PHONE_NUMBER} into Vapi via Twilio…`);

  const created = await client.phoneNumbers.create({
    provider: "twilio",
    number: TWILIO_PHONE_NUMBER,
    twilioAccountSid: TWILIO_ACCOUNT_SID,
    twilioAuthToken: TWILIO_AUTH_TOKEN,
  } as Parameters<typeof client.phoneNumbers.create>[0]);

  const c = created as Record<string, unknown>;
  console.log(`\nSuccess!`);
  console.log(`  Number : ${c.number}`);
  console.log(`  UUID   : ${c.id}`);
  console.log(`\nUpdate your .env:\n  VAPI_PHONE_NUMBER_ID=${c.id}`);
}

main().catch((err) => {
  console.error("Failed:", err?.message ?? err);
  process.exit(1);
});
