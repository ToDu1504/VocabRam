"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText, modeLabel } from "@/lib/api";
import type { Level, ReviewSession } from "@/types";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorBox, Loading } from "@/components/Status";

export function Dashboard() {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.levels(), api.activeReviews()])
      .then(([l, r]) => {
        setLevels(l);
        setReviews(r);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  // "Continue": first unfinished unit of the first unfinished level.
  const continueLearning = async () => {
    try {
      const level = levels?.find((l) => l.total > 0 && l.learned < l.total);
      if (!level) return;
      const { units } = await api.units(level.code);
      const unit = units.find((u) => u.learned < u.total);
      if (unit) router.push(`/learn/${unit.id}`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!levels) return <Loading />;

  const learned = levels.reduce((s, l) => s + l.learned, 0);
  const total = levels.reduce((s, l) => s + l.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Nạp từ vựng, nhớ như RAM</h1>
          <p className="mt-1 text-muted">
            Đã thuộc <strong className="text-fg">{learned}</strong> / {total} từ
          </p>
          <ProgressBar value={learned} total={total} className="mt-3" />
        </div>
        {learned < total && (
          <button type="button" onClick={continueLearning} className="btn bg-accent text-white hover:bg-accent/90">
            Tiếp tục học
          </button>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label">Phiên ôn đang dở</h2>
          {reviews.map((r) => (
            <Link
              key={r.id}
              href={`/review/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-hint/40 bg-hint/10 px-4 py-3 hover:bg-hint/20"
            >
              <span>
                Tiếp tục {modeLabel[r.mode].toLowerCase()} {r.levelCode ?? ""}
                {r.unit ? ` · Unit ${r.unit.number}` : ""}
              </span>
              <span className="font-mono text-sm text-hint">
                {r.position}/{r.total}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {levels.map((l) => {
          const empty = l.total === 0;
          const done = !empty && l.learned === l.total;
          const body = (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{l.code}</span>
                <span className="text-sm text-muted">{l.name}</span>
              </div>
              <p className="text-sm text-muted">
                {empty ? "Chưa có nội dung" : `${l.learned} / ${l.total} từ · ${l.unitCount} unit`}
              </p>
              <ProgressBar value={l.learned} total={l.total} />
            </>
          );
          const cls = `flex flex-col gap-3 rounded-2xl border bg-panel p-5 ${done ? "border-success" : "border-line"}`;
          return empty ? (
            <div key={l.code} className={`${cls} opacity-50`}>
              {body}
            </div>
          ) : (
            <Link key={l.code} href={`/levels/${l.code}`} className={`${cls} hover:border-accent`}>
              {body}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
