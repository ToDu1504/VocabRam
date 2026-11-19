import { unitRepository } from "../repositories/unit.repository.js";
import { wordRepository } from "../repositories/word.repository.js";
import { notFound } from "../utils/httpError.js";

export const unitService = {
  async words(userId: number, unitId: number) {
    const unit = await unitRepository.findById(unitId);
    if (!unit) throw notFound(`Unit ${unitId} not found`);
    const words = await wordRepository.findByUnitWithProgress(unitId, userId);
    return {
      unit: { id: unit.id, number: unit.number, level: unit.level.code },
      words: words.map(({ progress, ...w }) => ({
        ...w,
        status: progress[0]?.status ?? "NEW",
      })),
    };
  },
};
