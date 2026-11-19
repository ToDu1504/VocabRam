import { levelRepository } from "../repositories/level.repository.js";
import { unitRepository } from "../repositories/unit.repository.js";
import { progressRepository } from "../repositories/progress.repository.js";
import { notFound } from "../utils/httpError.js";

export const levelService = {
  async list(userId: number) {
    const [levels, units, learned] = await Promise.all([
      levelRepository.findAll(),
      unitRepository.findWithWordCounts(),
      progressRepository.learnedCountByUnit(userId),
    ]);
    return levels.map((lv) => {
      const own = units.filter((u) => u.levelId === lv.id);
      return {
        code: lv.code,
        name: lv.name,
        order: lv.order,
        unitCount: own.length,
        total: own.reduce((s, u) => s + u._count.words, 0),
        learned: own.reduce((s, u) => s + (learned.get(u.id) ?? 0), 0),
      };
    });
  },

  async units(userId: number, code: string) {
    const level = await levelRepository.findByCode(code);
    if (!level) throw notFound(`Level ${code} not found`);
    const [units, learned] = await Promise.all([
      unitRepository.findWithWordCounts(level.id),
      progressRepository.learnedCountByUnit(userId, level.id),
    ]);
    return {
      level: { code: level.code, name: level.name },
      units: units.map((u) => ({
        id: u.id,
        number: u.number,
        total: u._count.words,
        learned: learned.get(u.id) ?? 0,
      })),
    };
  },
};
