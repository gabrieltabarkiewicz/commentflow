import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const flows = await prisma.flow.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(flows);
}

const FlowInput = z.object({
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  scope: z.enum(["ALL_POSTS", "SPECIFIC_POST"]).optional(),
  mediaId: z.string().nullish(),
  matchType: z.enum(["ANY", "KEYWORD"]).optional(),
  keywords: z.array(z.string()).optional(),
  publicReplies: z.array(z.string()).optional(),
  dmMessage: z.string().nullish(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = FlowInput.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const flow = await prisma.flow.create({
    data: {
      name: data.name,
      enabled: data.enabled ?? true,
      scope: data.scope ?? "ALL_POSTS",
      mediaId: data.mediaId ?? null,
      matchType: data.matchType ?? "ANY",
      keywords: data.keywords ?? [],
      publicReplies: data.publicReplies ?? [],
      dmMessage: data.dmMessage ?? null,
    },
  });
  return Response.json(flow, { status: 201 });
}
