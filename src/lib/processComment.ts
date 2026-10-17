import { prisma } from "@/lib/db";
import { replyToComment, sendPrivateReply } from "@/lib/meta";
import { getActiveCredentials } from "@/lib/credentials";
import { asDmFlow, buildStepMessage } from "@/lib/flowTypes";

export interface IncomingComment {
  commentId: string;
  mediaId?: string;
  fromUserId?: string;
  fromUsername?: string;
  text?: string;
  raw?: unknown;
}

function pickRandom(items: string[]): string | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Match an incoming comment against enabled flows and run the first match's
 * actions (public reply + optional DM). Idempotent per commentId.
 */
export async function processComment(c: IncomingComment) {
  if (!c.commentId) return { skipped: "no-comment-id" };

  const existing = await prisma.commentEvent.findUnique({
    where: { commentId: c.commentId },
  });
  if (existing?.processed) return { skipped: "already-processed" };

  await prisma.commentEvent.upsert({
    where: { commentId: c.commentId },
    update: {},
    create: {
      commentId: c.commentId,
      mediaId: c.mediaId,
      fromUserId: c.fromUserId,
      fromUsername: c.fromUsername,
      text: c.text,
      raw: (c.raw ?? null) as object,
    },
  });

  const markProcessed = () =>
    prisma.commentEvent.update({
      where: { commentId: c.commentId },
      data: { processed: true },
    });

  const creds = await getActiveCredentials();

  // Never react to our own comments (prevents reply loops).
  if (c.fromUserId && creds.igUserId && c.fromUserId === creds.igUserId) {
    await markProcessed();
    return { skipped: "own-comment" };
  }

  const flows = await prisma.flow.findMany({ where: { enabled: true } });
  const text = (c.text ?? "").toLowerCase();

  const matched = flows.find((f) => {
    if (f.scope === "SPECIFIC_POST" && f.mediaId && f.mediaId !== c.mediaId) {
      return false;
    }
    if (f.matchType === "KEYWORD") {
      return f.keywords.some((k) => text.includes(k.toLowerCase()));
    }
    return true; // ANY
  });

  if (!matched) {
    await markProcessed();
    return { matched: false };
  }

  if (!creds.accessToken) {
    await prisma.activityLog.create({
      data: {
        type: "no_credentials",
        commentId: c.commentId,
        flowId: matched.id,
      },
    });
    await markProcessed();
    return { matched: true, flowId: matched.id, skipped: "no-credentials" };
  }

  const actions: string[] = [];

  const publicMsg = pickRandom(matched.publicReplies);
  if (publicMsg) {
    const r = await replyToComment(creds, c.commentId, publicMsg);
    await prisma.activityLog.create({
      data: {
        type: r.ok ? "public_reply" : "public_reply_error",
        commentId: c.commentId,
        flowId: matched.id,
        detail: r as unknown as object,
      },
    });
    actions.push(r.ok ? "public_reply" : "public_reply_error");
  }

  // DM: prefer a multi-step flow (quick replies); otherwise the simple message.
  const dmFlow = asDmFlow(matched.dmFlow);
  if (dmFlow) {
    const entry = buildStepMessage(matched.id, dmFlow, dmFlow.entry);
    if (entry) {
      const r = await sendPrivateReply(
        creds,
        c.commentId,
        entry.text,
        entry.quickReplies,
      );
      await prisma.activityLog.create({
        data: {
          type: r.ok ? "dm_flow" : "dm_flow_error",
          commentId: c.commentId,
          flowId: matched.id,
          detail: r as unknown as object,
        },
      });
      actions.push(r.ok ? "dm_flow" : "dm_flow_error");
    }
  } else if (matched.dmMessage) {
    const r = await sendPrivateReply(creds, c.commentId, matched.dmMessage);
    await prisma.activityLog.create({
      data: {
        type: r.ok ? "dm" : "dm_error",
        commentId: c.commentId,
        flowId: matched.id,
        detail: r as unknown as object,
      },
    });
    actions.push(r.ok ? "dm" : "dm_error");
  }

  await markProcessed();
  return { matched: true, flowId: matched.id, actions };
}
