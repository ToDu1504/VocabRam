import type { AnswerResult, Level, ReviewMode, ReviewSession, UnitSummary, Word } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Không kết nối được backend (localhost:4000). Đã chạy `npm run dev` trong backend chưa?");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? "HTTP", data?.error?.message ?? res.statusText);
  return data as T;
}

export interface AnswerBody {
  result: AnswerResult;
  hintsUsed: number;
}

export type CreateReview = { mode: "UNIT"; unitId: number } | { mode: "LEVEL"; levelCode: string } | { mode: "ALL" };

export const api = {
  levels: () => request<{ levels: Level[] }>("/levels").then((d) => d.levels),
  units: (code: string) => request<{ level: { code: string; name: string }; units: UnitSummary[] }>(`/levels/${code}/units`),
  unitWords: (id: number) => request<{ unit: { id: number; number: number; level: string }; words: Word[] }>(`/units/${id}/words`),
  answer: (wordId: number, body: AnswerBody) => request(`/words/${wordId}/answer`, { method: "POST", body }),

  activeReviews: () => request<{ sessions: ReviewSession[] }>("/reviews/active").then((d) => d.sessions),
  createReview: (body: CreateReview) => request<ReviewSession>("/reviews", { method: "POST", body }),
  review: (id: number) => request<ReviewSession>(`/reviews/${id}`),
  reviewAnswer: (id: number, body: AnswerBody & { wordId: number }) =>
    request<ReviewSession>(`/reviews/${id}/answer`, { method: "POST", body }),
};

export const modeLabel: Record<ReviewMode, string> = {
  UNIT: "Ôn unit",
  ALL: "Ôn tổng hợp",
  LEVEL: "Ôn hoàn thành level",
};

export function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Có lỗi xảy ra";
}
