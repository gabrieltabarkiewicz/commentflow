import { env } from "@/lib/env";

const base = () => `https://graph.facebook.com/${env.graphVersion}`;

export interface IgCredentials {
  accessToken: string;
  igUserId: string;
}

export interface QuickReply {
  title: string;
  payload: string;
}

export interface GraphResult {
  ok: boolean;
  status: number;
  body: unknown;
}

async function graphPost(
  url: string,
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<GraphResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: accessToken }),
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: { error: String(error) } };
  }
}

function buildMessage(text: string, quickReplies?: QuickReply[]) {
  const message: Record<string, unknown> = { text };
  if (quickReplies && quickReplies.length > 0) {
    message.quick_replies = quickReplies.map((q) => ({
      content_type: "text",
      title: q.title,
      payload: q.payload,
    }));
  }
  return message;
}

/**
 * Public reply to a comment.
 * POST /{ig-comment-id}/replies  (needs instagram_manage_comments)
 */
export function replyToComment(
  creds: IgCredentials,
  commentId: string,
  message: string,
): Promise<GraphResult> {
  return graphPost(`${base()}/${commentId}/replies`, creds.accessToken, {
    message,
  });
}

/**
 * Send a DM. recipient is either { comment_id } (private reply to a comment)
 * or { id } (a message to a user PSID, e.g. after a quick-reply tap).
 * POST /{ig-user-id}/messages  (needs instagram_manage_messages)
 */
export function sendDm(
  creds: IgCredentials,
  recipient: { comment_id?: string; id?: string },
  text: string,
  quickReplies?: QuickReply[],
): Promise<GraphResult> {
  return graphPost(`${base()}/${creds.igUserId}/messages`, creds.accessToken, {
    recipient,
    messaging_type: "RESPONSE",
    message: buildMessage(text, quickReplies),
  });
}

/** Comment -> DM (private reply). Optionally with quick replies. */
export function sendPrivateReply(
  creds: IgCredentials,
  commentId: string,
  text: string,
  quickReplies?: QuickReply[],
): Promise<GraphResult> {
  return sendDm(creds, { comment_id: commentId }, text, quickReplies);
}
