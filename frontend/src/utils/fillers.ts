// Single-word filler markers we highlight inline in the transcript.
const FILLERS = new Set([
  "um",
  "uh",
  "erm",
  "er",
  "ah",
  "hmm",
  "like",
  "actually",
  "basically",
  "literally",
  "well",
  "yeah",
  "okay",
  "ok",
]);

// Multi-word filler phrases counted (not individually highlighted).
const FILLER_PHRASES = ["you know", "sort of", "kind of", "i mean"];

export const normalizeToken = (t: string): string =>
  t.toLowerCase().replace(/[^a-z']/g, "");

export const isFiller = (token: string): boolean => FILLERS.has(normalizeToken(token));

export function countFillers(text: string): number {
  const lower = ` ${text.toLowerCase()} `;
  let count = 0;
  const tokens = text.split(/\s+/).filter(Boolean);
  for (const tok of tokens) if (isFiller(tok)) count += 1;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/ /g, "\\s+")}\\b`, "g");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function computeWpm(words: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round(words / (seconds / 60));
}
