import type { ProgressStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const progressRepository = {
  // Number of LEARNED words per unit for a user.
  learnedCountByUnit: async (userId: number, levelId?: number) => {
    const rows = await prisma.userWordProgress.findMany({
      where: { userId, status: "LEARNED", ...(levelId ? { word: { unit: { levelId } } } : {}) },
      select: { word: { select: { unitId: true } } },
    });
    const map = new Map<number, number>();
    for (const r of rows) map.set(r.word.unitId, (map.get(r.word.unitId) ?? 0) + 1);
    return map;
  },

  upsert: (
    userId: number,
    wordId: number,
    data: { status: ProgressStatus; correct: number; wrong: number; hints: number },
  ) =>
    prisma.userWordProgress.upsert({
      where: { userId_wordId: { userId, wordId } },
      create: {
        userId,
        wordId,
        status: data.status,
        correctCount: data.correct,
        wrongCount: data.wrong,
        hintCount: data.hints,
        lastReviewedAt: new Date(),
      },
      update: {
        status: data.status,
        correctCount: { increment: data.correct },
        wrongCount: { increment: data.wrong },
        hintCount: { increment: data.hints },
        lastReviewedAt: new Date(),
      },
    }),
};
