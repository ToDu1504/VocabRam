import type { Word } from "@/types";

export const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ");

// "She {{went}} to school." -> { before: "She ", target: "went", after: " to school." }
export function splitExample(example: string) {
  const m = /\{\{(.+?)\}\}/.exec(example);
  if (!m) return { before: example, target: "", after: "" };
  return { before: example.slice(0, m.index), target: m[1]!, after: example.slice(m.index + m[0].length) };
}

export function acceptedAnswers(w: Pick<Word, "word" | "exampleEn" | "variants">) {
  const set = new Set([normalize(w.word)]);
  const { target } = splitExample(w.exampleEn);
  if (target) set.add(normalize(target));
  for (const v of w.variants ?? []) set.add(normalize(v));
  return set;
}

export const isCorrect = (input: string, w: Pick<Word, "word" | "exampleEn" | "variants">) =>
  acceptedAnswers(w).has(normalize(input));

export const isLetter = (ch: string) => /\p{L}/u.test(ch);
