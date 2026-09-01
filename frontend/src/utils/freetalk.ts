// Free-talk daily practice stats — stored on-device (localStorage on web).
import { storage } from "@/src/utils/storage";

const KEY = "free_talk_v1";

export type FreeTalkStore = {
  dailyGoalMin: number;
  streak: number;
  lastGoalDate: string; // YYYY-MM-DD the daily goal was last met
  byDate: Record<string, number>; // seconds practiced per day
};

const DEFAULT: FreeTalkStore = {
  dailyGoalMin: 20,
  streak: 0,
  lastGoalDate: "",
  byDate: {},
};

export const todayKey = (): string => new Date().toISOString().slice(0, 10);

const yesterdayKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export async function getFreeTalk(): Promise<FreeTalkStore> {
  const s = await storage.getItem<FreeTalkStore>(KEY, DEFAULT);
  return s && typeof s === "object" ? { ...DEFAULT, ...s } : { ...DEFAULT };
}

export async function setGoal(min: number): Promise<FreeTalkStore> {
  const s = await getFreeTalk();
  s.dailyGoalMin = min;
  await storage.setItem(KEY, s);
  return s;
}

export async function addSeconds(sec: number): Promise<FreeTalkStore> {
  const s = await getFreeTalk();
  if (sec <= 0) return s;
  const t = todayKey();
  s.byDate[t] = (s.byDate[t] ?? 0) + sec;
  if (s.byDate[t] >= s.dailyGoalMin * 60 && s.lastGoalDate !== t) {
    s.streak = s.lastGoalDate === yesterdayKey() ? s.streak + 1 : 1;
    s.lastGoalDate = t;
  }
  await storage.setItem(KEY, s);
  return s;
}

export const todaySeconds = (s: FreeTalkStore): number => s.byDate[todayKey()] ?? 0;
