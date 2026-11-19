"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText, modeLabel } from "@/lib/api";
import type { AnswerResult, ReviewSession } from "@/types";
import { ArrowLeftIcon } from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import { ResultScreen } from "@/components/ResultScreen";
import { ErrorBox, Loading } from "@/components/Status";
import { WordCard } from "@/components/WordCard";

export function ReviewView() {
  const id = Number(useParams<{ sessionId: string }>().sessionId);
  const [s, setS] = useState<ReviewSession | null>(null);
  const [hints, setHints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.review(id).then(setS).catch((e) => setError(errorText(e)));
  }, [id]);

  const onDone = async (result: AnswerResult, hintsUsed: number) => {
    if (!s?.word || busy) return;
    setBusy(true);
    try {
      setS(await api.reviewAnswer(s.id, { wordId: s.word.id, result, hintsUsed }));
      setHints((h) => h + hintsUsed);
      setError(null);
    } catch (e) {
      setError(errorText(e));
      api.review(id).then(setS).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (!s) return error ? <ErrorBox message={error} /> : <Loading />;

  const title = `${modeLabel[s.mode]}${s.levelCode ? ` ${s.levelCode}` : ""}${s.unit ? ` · Unit ${s.unit.number}` : ""}`;
  const back = s.mode === "UNIT" && s.levelCode ? `/levels/${s.levelCode}` : "/review";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href={back} aria-label="Quay lại" className="grid size-11 place-items-center rounded-lg border border-line hover:border-accent">
          <ArrowLeftIcon />
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold">
            {title}
            {s.phase === "RETRY_WRONG" && <span className="ml-2 text-sm text-hint">Ôn lại từ sai</span>}
          </h1>
          <ProgressBar value={s.position} total={s.total} className="mt-2" />
        </div>
        <span className="font-mono text-sm text-muted">
          {s.position}/{s.total}
        </span>
      </div>

      {error && <ErrorBox message={error} />}

      {s.status === "COMPLETED" ? (
        <ResultScreen
          title={s.mode === "LEVEL" ? `Hoàn thành level ${s.levelCode}!` : "Xong lượt ôn!"}
          stats={[
            ["Lượt trả lời", s.total],
            ["Từ bị sai", s.wrongCount],
            ["Hint (phiên này)", hints],
            ["Chế độ", s.mode],
          ]}
        >
          <Link href="/review" className="btn border border-line hover:border-accent">
            Ôn tập
          </Link>
          <Link href="/" className="btn bg-accent text-white hover:bg-accent/90">
            Trang chủ
          </Link>
        </ResultScreen>
      ) : (
        s.word && <WordCard key={`${s.id}-${s.phase}-${s.position}`} word={s.word} onDone={onDone} />
      )}
    </div>
  );
}
