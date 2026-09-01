// Local session history — persisted on-device (localStorage on web via the
// storage util, AsyncStorage on native). No backend, no login.
import { storage } from "@/src/utils/storage";
import type { Assessment } from "@/src/api/client";

const KEY = "practice_history_v1";
const MAX = 100;

export type HistoryStats = {
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  fillerCount: number;
};

export type HistoryEntry = {
  id: string;
  mode: "ielts" | "icao";
  practiceType: string;
  practiceLabel: string;
  prompt: string;
  transcript: string;
  assessment: Assessment;
  stats: HistoryStats;
  createdAt: string; // ISO
};

export async function getHistory(): Promise<HistoryEntry[]> {
  const list = await storage.getItem<HistoryEntry[]>(KEY, []);
  return Array.isArray(list) ? list : [];
}

export async function addHistory(
  entry: Omit<HistoryEntry, "id" | "createdAt">,
): Promise<HistoryEntry> {
  const full: HistoryEntry = {
    ...entry,
    id: `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const list = await getHistory();
  const next = [full, ...list].slice(0, MAX);
  await storage.setItem(KEY, next);
  return full;
}

export async function deleteHistory(id: string): Promise<void> {
  const list = await getHistory();
  await storage.setItem(
    KEY,
    list.filter((x) => x.id !== id),
  );
}

export async function clearHistory(): Promise<void> {
  await storage.setItem(KEY, []);
}
