import { progressRepository } from "../repositories/progress.repository.js";
import { wordRepository } from "../repositories/word.repository.js";
import { notFound } from "../utils/httpError.js";
import type { AnswerBody } from "../schemas/index.js";

export const progressService = {
  // correct -> LEARNED; dont_know -> LEARNING (+1 wrong), even if it was LEARNED before.
  async answer(userId: number, wordId: number, { result, hintsUsed }: AnswerBody) {
    if (!(await wordRepository.exists(wordId))) throw notFound(`Word ${wordId} not found`);
    const correct = result === "correct";
    const p = await progressRepository.upsert(userId, wordId, {
      status: correct ? "LEARNED" : "LEARNING",
      correct: correct ? 1 : 0,
      wrong: correct ? 0 : 1,
      hints: hintsUsed,
    });
    return {
      wordId,
      status: p.status,
      correctCount: p.correctCount,
      wrongCount: p.wrongCount,
      hintCount: p.hintCount,
    };
  },
};
