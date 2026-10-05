import { promises as fs } from "fs";
import path from "path";
import type { ProfileRow } from "@/types/database";

const STORE_PATH = path.join(process.cwd(), ".data", "dev-profiles.json");

async function ensureStore(): Promise<Record<string, ProfileRow>> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as Record<string, ProfileRow>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, ProfileRow>) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function upsertDevProfile(profile: ProfileRow): Promise<void> {
  const store = await ensureStore();
  store[profile.id] = profile;
  await writeStore(store);
}

export async function listDevProfiles(): Promise<ProfileRow[]> {
  const store = await ensureStore();
  return Object.values(store).sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || ""),
  );
}

export async function getDevProfile(id: string): Promise<ProfileRow | null> {
  const store = await ensureStore();
  return store[id] ?? null;
}