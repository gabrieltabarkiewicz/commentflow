import { z } from "zod";

export const flowInputSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  enabled: z.boolean().optional(),
  scope: z.enum(["ALL_POSTS", "SPECIFIC_POST"]).optional(),
  mediaId: z.string().nullish(),
  matchType: z.enum(["ANY", "KEYWORD"]).optional(),
  keywords: z.array(z.string()).optional(),
  publicReplies: z.array(z.string()).optional(),
  dmMessage: z.string().nullish(),
});

export type FlowInput = z.infer<typeof flowInputSchema>;
