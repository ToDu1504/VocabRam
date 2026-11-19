"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText, modeLabel, type CreateReview } from "@/lib/api";
import type { Level, ReviewSession } from "@/types";
import { ErrorBox, Loading } from "@/components/Status";

export function ReviewHome() {
  const router = useRouter();
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [active, setActive] = useState<ReviewSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.levels(), api.activeReviews()])
      .then(([l, a]) => {
        setLevels(l);
        setActive(a);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  const start = async (body: CreateReview) => {
    try {
      setError(null);
      const s = await api.createReview(body);
      router.push(`/review/${s.id}`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  if (!levels) return error ? <ErrorBox message={error} /> : <Loading />;
  const learnedTotal = levels.reduce((s, l) => s + l.learned, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Ôn tập</h1>
      {error && <ErrorBox message={error} />}

      {active.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label">Đang dở</h2>
          {active.map((r) => (
            <Link key={r.id} href={`/review/${r.id}`} className="flex items-center justify-between rounded-xl border border-hint/40 bg-hint/10 px-4 py-3 hover:bg-hint/20">
              <span>
                {modeLabel[r.mode]} {r.levelCode ?? ""}
                {r.unit ? ` · Unit ${r.unit.number}` : ""}
                {r.phase === "RETRY_WRONG" ? " · ôn lại từ sai" : ""}
              </span>
              <span className="font-mono text-sm text-hint">
                {r.position}/{r.total}
              </span>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold">Ôn tổng hợp</h2>
        <p className="text-sm text-muted">20 từ trong số các từ đã thuộc, ưu tiên từ hay sai và lâu chưa ôn. Từ sai quay lại cuối lượt.</p>
        <button type="button" onClick={() => start({ mode: "ALL" })} disabled={learnedTotal === 0} className="btn self-start bg-accent text-white hover:bg-accent/90 disabled:opacity-40">
          Bắt đầu ({learnedTotal} từ đã thuộc)
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold">Ôn hoàn thành level</h2>
        <p className="text-sm text-muted">
          Toàn bộ từ của level, xáo trộn, không lặp. Từ sai được gom lại và ôn ở cuối. Tiến độ được lưu sau mỗi câu.
        </p>
        <div className="flex flex-wrap gap-3">
          {levels
            .filter((l) => l.total > 0)
            .map((l) => (
              <button key={l.code} type="button" onClick={() => start({ mode: "LEVEL", levelCode: l.code })} className="btn border border-line hover:border-accent">
                {l.code}
                <span className="text-xs font-normal text-muted">
                  {l.learned}/{l.total}
                </span>
              </button>
            ))}
        </div>
      </section>

      <p className="text-sm text-muted">Ôn một unit: mở level → chọn unit → “Ôn unit”.</p>
    </div>
  );
}
