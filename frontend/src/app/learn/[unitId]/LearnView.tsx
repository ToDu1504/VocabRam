"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import { shuffle } from "@/lib/shuffle";
import type { Word } from "@/types";
import { useLearningQueue } from "@/hooks/useLearningQueue";
import { ArrowLeftIcon } from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import { ResultScreen } from "@/components/ResultScreen";
import { ErrorBox, Loading } from "@/components/Status";
import { WordCard } from "@/components/WordCard";

interface Loaded {
  unit: { id: number; number: number; level: string };
  queue: Word[];
  nextUnitId: number | null;
}

export function LearnView() {
  const unitId = Number(useParams<{ unitId: string }>().unitId);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { unit, words } = await api.unitWords(unitId);
      const { units } = await api.units(unit.level);
      const idx = units.findIndex((u) => u.id === unit.id);
      // Continue with the words not learned yet; a finished unit is learned again in full.
      const pending = words.filter((w) => w.status !== "LEARNED");
      setData({ unit, queue: shuffle(pending.length ? pending : words), nextUnitId: units[idx + 1]?.id ?? null });
    })().catch((e) => setError(errorText(e)));
  }, [unitId]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;
  return <Session key={data.unit.id} {...data} />;
}

function Session({ unit, queue, nextUnitId }: Loaded) {
  const router = useRouter();
  const q = useLearningQueue(queue);
  const [error, setError] = useState<string | null>(null);

  const reviewUnit = async () => {
    try {
      const s = await api.createReview({ mode: "UNIT", unitId: unit.id });
      router.push(`/review/${s.id}`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const back = `/levels/${unit.level}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href={back} aria-label="Về danh sách unit" className="grid size-11 place-items-center rounded-lg border border-line hover:border-accent">
          <ArrowLeftIcon />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">
            {unit.level} · Unit {unit.number}
          </h1>
          <ProgressBar value={q.stats.total - q.remaining} total={q.stats.total} className="mt-2" />
        </div>
        <span className="font-mono text-sm text-muted">
          {q.stats.total - q.remaining}/{q.stats.total}
        </span>
      </div>

      {(q.saveError || error) && <ErrorBox message={`Không lưu được tiến độ: ${q.saveError ?? error}`} />}

      {q.done ? (
        <ResultScreen
          title={`Xong Unit ${unit.number}!`}
          stats={[
            ["Số từ", q.stats.total],
            ["Đúng lần đầu", q.stats.firstTry],
            ["Don't know", q.stats.dontKnow],
            ["Hint", q.stats.hints],
          ]}
        >
          <button type="button" onClick={reviewUnit} className="btn border border-line hover:border-accent">
            Ôn unit này
          </button>
          <Link href={back} className="btn border border-line hover:border-accent">
            Danh sách unit
          </Link>
          {nextUnitId && (
            <Link href={`/learn/${nextUnitId}`} className="btn bg-accent text-white hover:bg-accent/90">
              Unit tiếp theo
            </Link>
          )}
        </ResultScreen>
      ) : (
        q.current && <WordCard key={`${q.current.id}-${q.remaining}-${q.stats.dontKnow}`} word={q.current} onDone={q.answer} />
      )}
    </div>
  );
}
