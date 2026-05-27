import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleToolCall } from "@/lib/telephony/tools";
import { analyzeTranscript } from "@/lib/anthropic/analyze";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "No message" }, { status: 400 });
    }

    const { type, call, artifact, toolCallList, toolCallResultList } = message;
    const vapiCallId = call?.id;

    if (!vapiCallId) {
      return NextResponse.json({ received: true });
    }

    // Find the call record by vapiCallId
    const callRecord = await db.call.findFirst({ where: { vapiCallId } });

    switch (type) {
      case "call-started": {
        if (callRecord) {
          await db.call.update({
            where: { id: callRecord.id },
            data: { status: "IN_PROGRESS", startedAt: new Date() },
          });
          await db.lead.update({
            where: { id: callRecord.leadId },
            data: { status: "IN_PROGRESS" },
          });
        }
        break;
      }

      case "end-of-call-report": {
        const transcript = artifact?.transcript ?? "";
        const recordingUrl = artifact?.recordingUrl ?? null;

        if (callRecord) {
          await db.call.update({
            where: { id: callRecord.id },
            data: {
              status: "COMPLETED",
              endedAt: new Date(),
              transcript,
              recordingUrl,
            },
          });

          // §5.5 — Trigger post-call transcript analysis
          if (transcript) {
            try {
              const analysis = await analyzeTranscript(transcript);
              await db.call.update({
                where: { id: callRecord.id },
                data: { analysis: JSON.stringify(analysis) },
              });
              await db.lead.update({
                where: { id: callRecord.leadId },
                data: { status: "COMPLETED" },
              });
            } catch (err) {
              console.error("[webhook] transcript analysis failed", err);
              await db.lead.update({
                where: { id: callRecord.leadId },
                data: { status: "COMPLETED" },
              });
            }
          }
        }
        break;
      }

      case "tool-calls": {
        // §5.4 — Handle in-call tool calls
        if (!toolCallList?.length) break;
        const results = await Promise.all(
          toolCallList.map(
            async (tc: { id: string; function: { name: string; arguments: string } }) => {
              const params = (() => {
                try { return JSON.parse(tc.function.arguments); } catch { return {}; }
              })();
              const result = await handleToolCall(
                tc.function.name,
                params,
                callRecord?.leadId ?? ""
              );
              return { toolCallId: tc.id, result: result.result };
            }
          )
        );
        return NextResponse.json({ results });
      }

      case "status-update": {
        const status = call?.status;
        if (callRecord && status === "no-answer") {
          await db.call.update({
            where: { id: callRecord.id },
            data: { status: "NO_ANSWER", endedAt: new Date() },
          });
          await db.lead.update({
            where: { id: callRecord.leadId },
            data: { status: "NO_ANSWER" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[calls/webhook]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
