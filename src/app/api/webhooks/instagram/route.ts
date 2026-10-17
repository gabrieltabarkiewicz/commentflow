import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { verifySignature } from "@/lib/signature";
import { processComment } from "@/lib/processComment";
import { processMessaging } from "@/lib/processMessaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook verification handshake.
 * Meta calls GET with hub.mode / hub.verify_token / hub.challenge.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  if (mode === "subscribe" && token && token === env.igVerifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

interface CommentChange {
  field?: string;
  value?: {
    id?: string;
    text?: string;
    media?: { id?: string };
    from?: { id?: string; username?: string };
  };
}

interface MessagingEvent {
  sender?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload?: string };
  };
  postback?: { payload?: string };
}

interface WebhookPayload {
  entry?: Array<{
    changes?: CommentChange[];
    messaging?: MessagingEvent[];
  }>;
}

/**
 * Event ingestion. Verifies the signature, then handles:
 * - "comments" changes (someone commented)
 * - messaging events (someone tapped a quick reply / postback)
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  if (!verifySignature(raw, sig, env.metaAppSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const tasks: Promise<unknown>[] = [];

  for (const entry of payload.entry ?? []) {
    // Comments
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value ?? {};
      if (!v.id) continue;
      if (v.from?.id && v.from.id === env.igUserId) continue; // skip our own
      tasks.push(
        processComment({
          commentId: v.id,
          mediaId: v.media?.id,
          fromUserId: v.from?.id,
          fromUsername: v.from?.username,
          text: v.text,
          raw: change,
        }).catch((e) => console.error("processComment error", e)),
      );
    }

    // Messaging (quick replies / postbacks)
    for (const event of entry.messaging ?? []) {
      if (event.message?.is_echo) continue; // ignore our own outbound echoes
      const qrPayload =
        event.message?.quick_reply?.payload ?? event.postback?.payload;
      if (!qrPayload) continue;
      tasks.push(
        processMessaging({
          senderId: event.sender?.id,
          payload: qrPayload,
        }).catch((e) => console.error("processMessaging error", e)),
      );
    }
  }

  await Promise.allSettled(tasks);
  return new Response("EVENT_RECEIVED", { status: 200 });
}
