import { prisma } from "@/lib/db";
import { replyToComment, sendPrivateReply } from "@/lib/meta";

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
    await prisma.commentEvent.update({
      where: { commentId: c.commentId },
      data: { processed: true },
    });
    return { matched: false };
  }

  const actions: string[] = [];

  const publicMsg = pickRandom(matched.publicReplies);
  if (publicMsg) {
    const r = await replyToComment(c.commentId, publicMsg);
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

  if (matched.dmMessage) {
    const r = await sendPrivateReply(c.commentId, matched.dmMessage);
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

  await prisma.commentEvent.update({
    where: { commentId: c.commentId },
    data: { processed: true },
  });

  return { matched: true, flowId: matched.id, actions };
}
