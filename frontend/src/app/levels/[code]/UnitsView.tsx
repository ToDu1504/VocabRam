"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import type { UnitSummary } from "@/types";
import { ArrowLeftIcon, CheckIcon } from "@/components/Icons";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorBox, Loading } from "@/components/Status";

export function UnitsView() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ level: { code: string; name: string }; units: UnitSummary[] } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .units(code)
      .then((d) => {
        setData(d);
        setSelected((d.units.find((u) => u.learned < u.total) ?? d.units[0])?.id ?? null);
      })
      .catch((e) => setError(errorText(e)));
  }, [code]);

  const reviewUnit = async (unitId: number) => {
    try {
      const s = await api.createReview({ mode: "UNIT", unitId });
      router.push(`/review/${s.id}`);
    } catch (e) {
      setError(errorText(e));
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const learned = data.units.reduce((s, u) => s + u.learned, 0);
  const total = data.units.reduce((s, u) => s + u.total, 0);
  const sel = data.units.find((u) => u.id === selected);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Về trang chủ" className="grid size-11 place-items-center rounded-lg border border-line hover:border-accent">
          <ArrowLeftIcon />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {data.level.code} · {data.level.name}
          </h1>
          <p className="text-sm text-muted">
            {learned} / {total} từ · {data.units.length} unit
          </p>
        </div>
      </div>
      <ProgressBar value={learned} total={total} />

      {sel && (
        <section className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-accent bg-panel p-4">
          <div className="mr-auto">
            <p className="font-semibold">Unit {sel.number}</p>
            <p className="text-sm text-muted">
              {sel.learned}/{sel.total} cards
            </p>
          </div>
          <button type="button" onClick={() => reviewUnit(sel.id)} disabled={sel.learned === 0} className="btn border border-line hover:border-accent disabled:opacity-40">
            Ôn unit
          </button>
          <Link href={`/learn/${sel.id}`} className="btn bg-accent text-white hover:bg-accent/90">
            {sel.learned === sel.total ? "Học lại" : sel.learned > 0 ? "Học tiếp" : "Bắt đầu học"}
          </Link>
        </section>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.units.map((u) => {
          const done = u.learned === u.total;
          const isSel = u.id === selected;
          const cls = isSel
            ? "border-accent bg-accent text-white"
            : done
              ? "border-success text-success bg-panel"
              : "border-line bg-panel hover:border-accent";
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setSelected(u.id)}
                onDoubleClick={() => router.push(`/learn/${u.id}`)}
                aria-pressed={isSel}
                className={`flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left ${cls}`}
              >
                <span className="flex w-full items-center justify-between font-semibold">
                  Unit {u.number} {done && <CheckIcon />}
                </span>
                <span className={`text-sm ${isSel ? "text-white/80" : done ? "" : "text-muted"}`}>
                  {u.learned}/{u.total} cards
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
