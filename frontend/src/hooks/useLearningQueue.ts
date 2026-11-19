"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AnswerResult, Word } from "@/types";

export interface LearnStats {
  total: number;
  firstTry: number; // right on the first attempt, no "don't know" before
  dontKnow: number;
  wrongAttempts: number;
  hints: number;
}

/**
 * Plan §7.4: correct -> word leaves the queue (LEARNED); don't know -> word moves to the end (LEARNING).
 * A wrong typed attempt is retried in place and never reaches the server.
 */
export function useLearningQueue(initial: Word[]) {
  const [queue, setQueue] = useState(initial);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState<LearnStats>({ total: initial.length, firstTry: 0, dontKnow: 0, wrongAttempts: 0, hints: 0 });
  const [saveError, setSaveError] = useState<string | null>(null);

  const answer = useCallback(
    (result: AnswerResult, hintsUsed: number, wrongAttempts: number) => {
      const card = queue[0];
      if (!card) return;
      api.answer(card.id, { result, hintsUsed }).catch((e: Error) => setSaveError(e.message));

      setStats((s) => ({
        ...s,
        firstTry: s.firstTry + (result === "correct" && wrongAttempts === 0 && !missed.has(card.id) ? 1 : 0),
        dontKnow: s.dontKnow + (result === "dont_know" ? 1 : 0),
        wrongAttempts: s.wrongAttempts + wrongAttempts,
        hints: s.hints + hintsUsed,
      }));
      if (result === "correct") setQueue((q) => q.slice(1));
      else {
        setMissed((m) => new Set(m).add(card.id));
        setQueue((q) => [...q.slice(1), q[0]!]);
      }
    },
    [queue, missed],
  );

  return { current: queue[0] ?? null, remaining: queue.length, done: queue.length === 0, stats, answer, saveError };
}
