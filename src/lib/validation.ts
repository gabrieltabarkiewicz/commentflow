import { z } from "zod";

const quickReplySchema = z.object({
  title: z.string(),
  next: z.string().nullable(),
});

const flowStepSchema = z.object({
  text: z.string().trim().min(1, "Texto do passo obrigatório"),
  quickReplies: z.array(quickReplySchema).optional(),
});

export const dmFlowSchema = z
  .object({
    entry: z.string(),
    steps: z.record(flowStepSchema),
  })
  .superRefine((df, ctx) => {
    if (!df.steps[df.entry]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `entry "${df.entry}" não existe em steps`,
      });
    }
    for (const [id, step] of Object.entries(df.steps)) {
      for (const qr of step.quickReplies ?? []) {
        if (qr.next && !df.steps[qr.next]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `passo "${id}": next "${qr.next}" inexistente`,
          });
        }
      }
    }
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
