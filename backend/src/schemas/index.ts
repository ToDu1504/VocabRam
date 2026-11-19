import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });
export const levelCodeParam = z.object({
  code: z
    .string()
    .regex(/^(A1|A2|B1|B2|C1)$/i)
    .transform((s) => s.toUpperCase()),
});

export const answerBody = z.object({
  result: z.enum(["correct", "dont_know"]),
  hintsUsed: z.number().int().min(0).max(50).default(0),
});
export type AnswerBody = z.infer<typeof answerBody>;

export const createReviewBody = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("UNIT"), unitId: z.number().int().positive() }),
  z.object({ mode: z.literal("LEVEL"), levelCode: z.string().regex(/^(A1|A2|B1|B2|C1)$/i).transform((s) => s.toUpperCase()) }),
  z.object({ mode: z.literal("ALL") }),
]);
export type CreateReviewBody = z.infer<typeof createReviewBody>;

export const reviewAnswerBody = answerBody.extend({ wordId: z.number().int().positive() });
export type ReviewAnswerBody = z.infer<typeof reviewAnswerBody>;
