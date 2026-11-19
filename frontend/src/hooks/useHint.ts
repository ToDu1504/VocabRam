"use client";

import { useMemo, useState } from "react";
import { isLetter } from "@/lib/answer";

/**
 * Plan §7.6: each press reveals one more letter from the left, up to floor(letters / 2)
 * (words of 1–2 letters reveal nothing). The final hint plays the pronunciation, then the button locks.
 * Spaces and hyphens are always shown.
 */
export function useHint(answer: string, speak: () => void) {
  const [revealed, setRevealed] = useState(0);
  const [spoken, setSpoken] = useState(false);

  const letterCount = useMemo(() => [...answer].filter(isLetter).length, [answer]);
  const maxReveal = letterCount <= 2 ? 0 : Math.floor(letterCount / 2);

  const display = useMemo(() => {
    let seen = 0;
    return [...answer]
      .map((ch) => {
        if (!isLetter(ch)) return ch;
        return seen++ < revealed ? ch : "*";
      })
      .join("");
  }, [answer, revealed]);

  const use = () => {
    if (spoken) return;
    if (revealed < maxReveal) setRevealed((r) => r + 1);
    else {
      speak();
      setSpoken(true);
    }
  };

  return {
    display,
    use,
    hintsUsed: revealed + (spoken ? 1 : 0),
    nextIsAudio: revealed >= maxReveal && !spoken,
    locked: spoken,
  };
}
