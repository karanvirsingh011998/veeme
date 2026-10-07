import { promises as fs } from "fs";
import path from "path";
import { isMembershipKey, type MembershipKey } from "./catalog";

const STORE_PATH = path.join(process.cwd(), ".data", "dev-membership.json");

async function readAll(): Promise<Record<string, MembershipKey>> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, string>;
    const next: Record<string, MembershipKey> = {};
    for (const [userId, key] of Object.entries(parsed)) {
      if (isMembershipKey(key)) next[userId] = key;
    }
    return next;
  } catch {
    return {};
  }
}

export async function getDevMembership(userId: string): Promise<MembershipKey> {
  const all = await readAll();
  return all[userId] ?? "free";
}

export async function setDevMembership(userId: string, key: MembershipKey) {
  const all = await readAll();
  all[userId] = key;
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(all, null, 2), "utf8");
}
