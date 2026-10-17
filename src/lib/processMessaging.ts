import { prisma } from "@/lib/db";
import { getActiveCredentials } from "@/lib/credentials";
import { sendDm } from "@/lib/meta";
import { asDmFlow, buildStepMessage, decodePayload } from "@/lib/flowTypes";

export interface IncomingMessaging {
  senderId?: string;
  payload?: string; // quick_reply or postback payload
}

/**
 * Handle a quick-reply / postback tap: look up the target step and send it.
 * The payload itself carries the flow + next step, so no server-side session
 * is needed to advance the conversation.
 */
export async function processMessaging(e: IncomingMessaging) {
  if (!e.senderId || !e.payload) return { skipped: "no-payload" };

  const decoded = decodePayload(e.payload);
  if (!decoded || !decoded.stepId) return { skipped: "unknown-payload" };

  const flow = await prisma.flow.findUnique({ where: { id: decoded.flowId } });
  if (!flow || !flow.enabled) return { skipped: "no-flow" };

  const dmFlow = asDmFlow(flow.dmFlow);
  if (!dmFlow) return { skipped: "no-dmflow" };

  const msg = buildStepMessage(flow.id, dmFlow, decoded.stepId);
  if (!msg) return { skipped: "no-step" };

  const creds = await getActiveCredentials();
  if (!creds.accessToken) {
    await prisma.activityLog.create({
      data: { type: "no_credentials", flowId: flow.id },
    });
    return { skipped: "no-credentials" };
  }

  const r = await sendDm(creds, { id: e.senderId }, msg.text, msg.quickReplies);
  await prisma.activityLog.create({
    data: {
      type: r.ok ? "dm_step" : "dm_step_error",
      flowId: flow.id,
      detail: r as unknown as object,
    },
  });
  return { ok: r.ok, step: decoded.stepId };
}
