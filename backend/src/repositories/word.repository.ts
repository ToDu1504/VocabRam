import { prisma } from "../lib/prisma.js";

export const wordRepository = {
  findByUnitWithProgress: (unitId: number, userId: number) =>
    prisma.word.findMany({
      where: { unitId },
      orderBy: { position: "asc" },
      include: { progress: { where: { userId } } },
    }),
  exists: async (id: number) => (await prisma.word.count({ where: { id } })) > 0,
};
