import type { ReviewMode, ReviewSession } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";
import { shuffle } from "../utils/shuffle.js";
import { progressService } from "./progress.service.js";
import type { CreateReviewBody, ReviewAnswerBody } from "../schemas/index.js";

const ALL_POOL = 40; // take the 40 weakest learned words...
const ALL_SIZE = 20; // ...and review 20 of them

const ids = (v: unknown) => (Array.isArray(v) ? (v as number[]) : []);

/**
 * Session rules (plan §7.8):
 * - UNIT / ALL: wrong or "don't know" -> word is appended to the end of wordOrder. Done when the order runs out.
 * - LEVEL, phase MAIN: wrong -> remembered in wrongWordIds, never repeated immediately.
 *   End of MAIN -> phase RETRY_WRONG, which works like UNIT over the wrong words.
 * wrongWordIds holds every distinct word missed in the session (all modes), for the result screen.
 */
async function view(s: ReviewSession) {
  const order = ids(s.wordOrder);
  const done = s.status === "COMPLETED" || s.currentIndex >= order.length;
  const wordId = done ? null : order[s.currentIndex]!;
  const word = wordId ? await prisma.word.findUnique({ where: { id: wordId } }) : null;
  const level = s.levelId ? await prisma.level.findUnique({ where: { id: s.levelId } }) : null;
  const unit = s.unitId ? await prisma.unit.findUnique({ where: { id: s.unitId } }) : null;
  return {
    id: s.id,
    mode: s.mode,
    phase: s.phase,
    status: s.status,
    levelCode: level?.code ?? null,
    unit: unit ? { id: unit.id, number: unit.number } : null,
    position: s.currentIndex,
    total: order.length,
    wrongCount: ids(s.wrongWordIds).length,
    word,
    updatedAt: s.updatedAt,
  };
}

async function buildOrder(userId: number, body: CreateReviewBody) {
  if (body.mode === "UNIT") {
    const unit = await prisma.unit.findUnique({ where: { id: body.unitId }, include: { words: { select: { id: true } } } });
    if (!unit) throw notFound(`Unit ${body.unitId} not found`);
    return { unitId: unit.id, levelId: unit.levelId, order: shuffle(unit.words.map((w) => w.id)) };
  }
  if (body.mode === "LEVEL") {
    const level = await prisma.level.findUnique({ where: { code: body.levelCode } });
    if (!level) throw notFound(`Level ${body.levelCode} not found`);
    const words = await prisma.word.findMany({ where: { unit: { levelId: level.id } }, select: { id: true } });
    if (!words.length) throw new HttpError(400, "EMPTY", `Level ${level.code} has no words yet`);
    return { levelId: level.id, order: shuffle(words.map((w) => w.id)) };
  }
  const learned = await prisma.userWordProgress.findMany({
    where: { userId, status: "LEARNED" },
    orderBy: [{ wrongCount: "desc" }, { lastReviewedAt: { sort: "asc", nulls: "first" } }],
    take: ALL_POOL,
    select: { wordId: true },
  });
  if (!learned.length) throw new HttpError(400, "EMPTY", "No learned words to review yet");
  return { order: shuffle(learned.map((p) => p.wordId)).slice(0, ALL_SIZE) };
}

export const reviewService = {
  async active(userId: number) {
    const sessions = await prisma.reviewSession.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { updatedAt: "desc" },
    });
    return Promise.all(sessions.map(view));
  },

  // Returns the matching unfinished session if there is one, otherwise starts a new one.
  async create(userId: number, body: CreateReviewBody) {
    const built = await buildOrder(userId, body);
    const scope = { userId, mode: body.mode as ReviewMode, status: "IN_PROGRESS" as const };
    const where =
      body.mode === "UNIT" ? { ...scope, unitId: built.unitId } : body.mode === "LEVEL" ? { ...scope, levelId: built.levelId } : scope;
    const existing = await prisma.reviewSession.findFirst({ where });
    if (existing) return view(existing);

    const s = await prisma.reviewSession.create({
      data: {
        userId,
        mode: body.mode,
        levelId: built.levelId ?? null,
        unitId: built.unitId ?? null,
        wordOrder: built.order,
        wrongWordIds: [],
      },
    });
    return view(s);
  },

  async get(userId: number, id: number) {
    const s = await prisma.reviewSession.findFirst({ where: { id, userId } });
    if (!s) throw notFound(`Review ${id} not found`);
    return view(s);
  },

  async answer(userId: number, id: number, body: ReviewAnswerBody) {
    const s = await prisma.reviewSession.findFirst({ where: { id, userId } });
    if (!s) throw notFound(`Review ${id} not found`);
    if (s.status === "COMPLETED") throw new HttpError(409, "COMPLETED", "Review already completed");

    let order = ids(s.wordOrder);
    const current = order[s.currentIndex];
    if (current !== body.wordId) throw new HttpError(409, "OUT_OF_SYNC", "Answer is not for the current word");

    await progressService.answer(userId, body.wordId, body);

    const correct = body.result === "correct";
    const wrong = ids(s.wrongWordIds);
    if (!correct && !wrong.includes(body.wordId)) wrong.push(body.wordId);

    let index = s.currentIndex + 1;
    let phase = s.phase;
    const isLevelMain = s.mode === "LEVEL" && s.phase === "MAIN";
    if (!correct && !isLevelMain) order = [...order, body.wordId];

    let status: "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS";
    if (index >= order.length) {
      if (isLevelMain && wrong.length) {
        phase = "RETRY_WRONG";
        order = shuffle(wrong);
        index = 0;
      } else {
        status = "COMPLETED";
      }
    }

    const updated = await prisma.reviewSession.update({
      where: { id },
      data: { wordOrder: order, currentIndex: index, wrongWordIds: wrong, phase, status },
    });
    return view(updated);
  },
};
