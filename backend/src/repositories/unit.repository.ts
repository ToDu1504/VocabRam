import { prisma } from "../lib/prisma.js";

export const unitRepository = {
  // Units with their word counts, optionally for one level.
  findWithWordCounts: (levelId?: number) =>
    prisma.unit.findMany({
      where: levelId ? { levelId } : undefined,
      orderBy: [{ levelId: "asc" }, { number: "asc" }],
      select: { id: true, levelId: true, number: true, _count: { select: { words: true } } },
    }),
  findById: (id: number) => prisma.unit.findUnique({ where: { id }, include: { level: true } }),
};
