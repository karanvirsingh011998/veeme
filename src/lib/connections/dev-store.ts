import { promises as fs } from "fs";
import path from "path";
import type { Connection } from "./types";

const STORE_PATH = path.join(process.cwd(), ".data", "dev-connections.json");

async function ensureStore(): Promise<Connection[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as Connection[];
  } catch {
    return [];
  }
}

async function writeStore(rows: Connection[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(rows, null, 2), "utf8");
}

export async function listDevConnections(): Promise<Connection[]> {
  return ensureStore();
}

export async function upsertDevConnection(
  connection: Connection,
): Promise<Connection> {
  const all = await ensureStore();
  const next = [
    connection,
    ...all.filter((c) => c.id !== connection.id),
  ];
  await writeStore(next);
  return connection;
}

export async function getDevConnection(id: string): Promise<Connection | null> {
  const all = await ensureStore();
  return all.find((c) => c.id === id) ?? null;
}
