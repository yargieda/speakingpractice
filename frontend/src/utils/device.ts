import { storage } from "@/src/utils/storage";

const KEY = "device_id";

export async function getDeviceId(): Promise<string> {
  const existing = await storage.getItem<string>(KEY, "");
  if (existing) return existing;
  const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await storage.setItem(KEY, id);
  return id;
}
