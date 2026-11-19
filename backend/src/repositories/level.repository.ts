import { prisma } from "../lib/prisma.js";

export const levelRepository = {
  findAll: () => prisma.level.findMany({ orderBy: { order: "asc" } }),
  findByCode: (code: string) => prisma.level.findUnique({ where: { code } }),
};
