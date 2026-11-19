"use client";

import { useCallback } from "react";

// Real audio first, browser voice (en-US) as fallback. Must be called from a user action.
export function useSpeech() {
  return useCallback((word: { word: string; audioUrl?: string | null }) => {
    if (word.audioUrl) {
      void new Audio(word.audioUrl).play().catch(() => {});
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word.word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);
}
