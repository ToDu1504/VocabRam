"use client";

import { useEffect, useRef, useState } from "react";
import { isCorrect } from "@/lib/answer";
import { useHint } from "@/hooks/useHint";
import { useSpeech } from "@/hooks/useSpeech";
import type { AnswerResult, Word } from "@/types";
import { MaskedSentence } from "./MaskedSentence";
import { BulbIcon, CheckIcon, SpeakerIcon } from "./Icons";

type Phase = "asking" | "correct" | "revealed";

interface Props {
  word: Word;
  // Called when the learner moves on: result, hints used, wrong typed attempts.
  onDone: (result: AnswerResult, hintsUsed: number, wrongAttempts: number) => void;
}

const posLabel = (pos: string) => pos.replace(/\b\w/g, (c) => c.toUpperCase());

// Mount with key={word.id + ...} so every card starts fresh.
export function WordCard({ word, onDone }: Props) {
  const speak = useSpeech();
  const hint = useHint(word.word, () => speak(word));
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("asking");
  const [wrong, setWrong] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answered = phase !== "asking";

  const check = () => {
    if (answered || !input.trim()) return;
    if (isCorrect(input, word)) {
      setPhase("correct");
    } else {
      setWrong((n) => n + 1);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      inputRef.current?.select();
    }
  };
  const dontKnow = () => !answered && setPhase("revealed");
  const next = () => onDone(phase === "correct" ? "correct" : "dont_know", hint.hintsUsed, wrong);

  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);

  // Shortcuts: Enter = check / next, Ctrl+H = hint, Esc = don't know.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (answered) next();
        else check();
      } else if (e.key === "Escape") {
        dontKnow();
      } else if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        if (!answered) hint.use();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <article className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex h-44 items-center justify-center bg-panel-2 sm:h-56">
        {word.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={word.imageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-7xl" aria-hidden="true">
            🐏
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <header className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold sm:text-3xl">{word.meaningVi}</h2>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-sm text-accent">
            {posLabel(word.pos)}
          </span>
          {answered && (
            <span className="flex items-center gap-2 text-muted">
              <span className="font-semibold text-fg">{word.word}</span>
              {word.ipa && <span>{word.ipa}</span>}
              <button
                type="button"
                onClick={() => speak(word)}
                aria-label={`Phát âm ${word.word}`}
                className="grid size-11 place-items-center rounded-full text-accent hover:bg-accent/10"
              >
                <SpeakerIcon />
              </button>
            </span>
          )}
        </header>

        <section>
          <h3 className="label">English definition</h3>
          <p>{word.definitionEn}</p>
        </section>
        <section>
          <h3 className="label">Definition</h3>
          <p className="text-muted">{word.definitionVi}</p>
        </section>
        <section className="rounded-xl border border-line bg-bg/60 p-4">
          <h3 className="label">Example</h3>
          <MaskedSentence text={word.exampleEn} revealed={answered} />
          <p className="mt-1 text-muted">{word.exampleVi}</p>
        </section>

        {!answered ? (
          <>
            <div className="flex items-center gap-3">
              <output className="flex-1 rounded-lg border border-line bg-bg/60 px-4 py-2.5 font-mono text-lg tracking-[0.2em]">
                {hint.display}
              </output>
              <button
                type="button"
                onClick={hint.use}
                disabled={hint.locked}
                className="btn border border-hint/50 text-hint hover:bg-hint/10 disabled:opacity-40"
                title="Ctrl+H"
              >
                {hint.nextIsAudio || hint.locked ? <SpeakerIcon /> : <BulbIcon />}
                Hint
              </button>
            </div>

            <label className="sr-only" htmlFor="answer">
              Từ tiếng Anh
            </label>
            <input
              id="answer"
              ref={inputRef}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter English word..."
              className={`w-full rounded-lg border bg-bg px-4 py-3 text-lg outline-none focus:border-accent ${
                shake ? "animate-shake border-danger" : "border-line"
              }`}
            />
            {wrong > 0 && <p className="-mt-3 text-sm text-danger">Chưa đúng, thử lại nhé.</p>}

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={dontKnow} className="btn border border-danger/50 text-danger hover:bg-danger/10" title="Esc">
                DON&apos;T KNOW
              </button>
              <button type="button" onClick={check} className="btn bg-accent text-white hover:bg-accent/90" title="Enter">
                CHECK ANSWER
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className={`flex items-center gap-2 font-semibold ${phase === "correct" ? "text-success" : "text-danger"}`}>
              {phase === "correct" ? (
                <>
                  <CheckIcon /> Chính xác!
                </>
              ) : (
                <>Đáp án: {word.word} — thẻ này sẽ quay lại sau.</>
              )}
            </p>
            <button ref={nextRef} type="button" onClick={next} className="btn bg-accent text-white hover:bg-accent/90">
              Tiếp tục (Enter)
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
