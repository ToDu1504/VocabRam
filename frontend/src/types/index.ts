export type ProgressStatus = "NEW" | "LEARNING" | "LEARNED";
export type AnswerResult = "correct" | "dont_know";
export type ReviewMode = "UNIT" | "ALL" | "LEVEL";

export interface Level {
  code: string;
  name: string;
  order: number;
  unitCount: number;
  total: number;
  learned: number;
}

export interface UnitSummary {
  id: number;
  number: number;
  total: number;
  learned: number;
}

export interface Word {
  id: number;
  unitId: number;
  position: number;
  word: string;
  pos: string;
  sense: string;
  variants: string[] | null;
  meaningVi: string;
  definitionEn: string;
  definitionVi: string;
  exampleEn: string; // contains {{...}}
  exampleVi: string;
  ipa: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  status?: ProgressStatus;
}

export interface ReviewSession {
  id: number;
  mode: ReviewMode;
  phase: "MAIN" | "RETRY_WRONG";
  status: "IN_PROGRESS" | "COMPLETED";
  levelCode: string | null;
  unit: { id: number; number: number } | null;
  position: number;
  total: number;
  wrongCount: number;
  word: Word | null;
}
