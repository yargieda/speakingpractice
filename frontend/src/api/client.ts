// Client-side API wrapper for AI evaluation. Base URL from env; routes prefixed /api.
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type Correction = { original: string; suggestion: string; note: string };

// Shape consumed by ScoreBadge + FeedbackCards.
export type Assessment = {
  scoreLabel: string;
  scoreValue: string;
  scoreCaption: string;
  summary?: string;
  grammar: Correction[];
  vocabulary: Correction[];
  phraseology?: Correction[] | null;
};

export type ScorePayload = {
  mode: "ielts" | "icao";
  practice_type: string;
  practice_label: string;
  prompt: string;
  transcript: string;
};

type RawAssessment = {
  score_label: string;
  score_value: string;
  score_caption: string;
  summary?: string;
  grammar: Correction[];
  vocabulary: Correction[];
  phraseology?: Correction[] | null;
};

const normalizeAssessment = (a: RawAssessment): Assessment => ({
  scoreLabel: a.score_label,
  scoreValue: a.score_value,
  scoreCaption: a.score_caption,
  summary: a.summary ?? "",
  grammar: a.grammar ?? [],
  vocabulary: a.vocabulary ?? [],
  phraseology: a.phraseology ?? null,
});

export async function scorePractice(payload: ScorePayload): Promise<Assessment> {
  const res = await fetch(`${BASE}/api/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Score failed (${res.status}): ${detail}`);
  }
  return normalizeAssessment(await res.json());
}
