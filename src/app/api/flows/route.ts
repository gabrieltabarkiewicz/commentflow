import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { flowInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const flows = await prisma.flow.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(flows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = flowInputSchema.safeParse(body);
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
      dmFlow: data.dmFlow
        ? (data.dmFlow as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });
  return Response.json(flow, { status: 201 });
}
