import { env } from "@/lib/env";

const base = () => `https://graph.facebook.com/${env.graphVersion}`;

export interface GraphResult {
  ok: boolean;
  status: number;
  body: unknown;
}

async function graphPost(url: string, payload: Record<string, unknown>): Promise<GraphResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: env.igAccessToken }),
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: { error: String(error) } };
  }
}

/**
 * Public reply to a comment.
 * POST /{ig-comment-id}/replies  (needs instagram_manage_comments)
 */
export function replyToComment(commentId: string, message: string): Promise<GraphResult> {
  return graphPost(`${base()}/${commentId}/replies`, { message });
}

/**
 * Comment -> DM (private reply). One DM allowed per comment within the window.
 * POST /{ig-user-id}/messages with recipient: { comment_id }
 * (needs instagram_manage_messages)
 */
export function sendPrivateReply(commentId: string, text: string): Promise<GraphResult> {
  return graphPost(`${base()}/${env.igUserId}/messages`, {
    recipient: { comment_id: commentId },
    message: { text },
  });
}
