import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { verifySignature } from "@/lib/signature";
import { processComment } from "@/lib/processComment";

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

/**
 * Event ingestion. Verifies the signature, then handles "comments" changes.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  if (!verifySignature(raw, sig, env.metaAppSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: {
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: {
          id?: string;
          text?: string;
          media?: { id?: string };
          from?: { id?: string; username?: string };
        };
      }>;
    }>;
  };

  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const tasks: Promise<unknown>[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value ?? {};
      if (!v.id) continue;
      // Never react to our own comments (prevents reply loops).
      if (v.from?.id && v.from.id === env.igUserId) continue;

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
  }

  await Promise.allSettled(tasks);
  return new Response("EVENT_RECEIVED", { status: 200 });
}
