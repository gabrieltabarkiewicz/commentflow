import { z } from "zod";

const quickReplySchema = z.object({
  title: z.string(),
  next: z.string().nullable(),
});

const flowStepSchema = z.object({
  text: z.string(),
  quickReplies: z.array(quickReplySchema).optional(),
});

export const dmFlowSchema = z.object({
  entry: z.string(),
  steps: z.record(flowStepSchema),
});

export const flowInputSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  enabled: z.boolean().optional(),
  scope: z.enum(["ALL_POSTS", "SPECIFIC_POST"]).optional(),
  mediaId: z.string().nullish(),
  matchType: z.enum(["ANY", "KEYWORD"]).optional(),
  keywords: z.array(z.string()).optional(),
  publicReplies: z.array(z.string()).optional(),
  dmMessage: z.string().nullish(),
  dmFlow: dmFlowSchema.nullish(),
});

export type FlowInput = z.infer<typeof flowInputSchema>;
