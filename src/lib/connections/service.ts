import { loadSwr } from "@/lib/cache/client-cache";
import type { Connection, ConnectionStatus } from "./types";

export type { Connection, ConnectionStatus };

const KEY = "vemee_connections_v1";

function readAll(): Connection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Connection[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: Connection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `conn_${Date.now()}`;
}

/** Sync local helper — prefer async APIs when possible. */
export function listConnections(): Connection[] {
  return readAll();
}

/** Sync local helper — prefer getConnectionBetweenAsync. */
export function getConnectionBetween(
  a: string,
  b: string,
): Connection | null {
  return (
    readAll().find(
      (c) =>
        (c.requesterId === a && c.recipientId === b) ||
        (c.requesterId === b && c.recipientId === a),
    ) ?? null
  );
}

export async function listConnectionsForAsync(
  userId: string,
): Promise<Connection[]> {
  if (!userId) return [];
  try {
    return await loadSwr(`connections:${userId}`, 12_000, async () => {
      const res = await fetch(
        `/api/connections?userId=${encodeURIComponent(userId)}`,
      );
      if (!res.ok) throw new Error("connections");
      const data = (await res.json()) as { connections?: Connection[] };
      return data.connections || [];
    });
  } catch {
    return readAll().filter(
      (c) => c.requesterId === userId || c.recipientId === userId,
    );
  }
}

export async function getConnectionBetweenAsync(
  a: string,
  b: string,
): Promise<Connection | null> {
  if (!a || !b) return null;
  const all = await listConnectionsForAsync(a);
  return (
    all.find(
      (c) =>
        (c.requesterId === a && c.recipientId === b) ||
        (c.requesterId === b && c.recipientId === a),
    ) ?? null
  );
}

export async function sendConnectRequest(
  requesterId: string,
  recipientId: string,
): Promise<{ ok: true; connection: Connection } | { ok: false; error: string }> {
  if (requesterId === recipientId) {
    return { ok: false, error: "You can’t connect with yourself." };
  }

  try {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId, recipientId }),
    });
    const data = (await res.json()) as {
      connection?: Connection;
      error?: string;
    };
    if (!res.ok || !data.connection) {
      return { ok: false, error: data.error || "Could not send request." };
    }
    // Mirror locally so sync helpers still work in the same browser.
    const rest = readAll().filter((c) => c.id !== data.connection!.id);
    writeAll([data.connection, ...rest]);
    return { ok: true, connection: data.connection };
  } catch {
    // Local fallback if API unavailable.
  }

  const existing = getConnectionBetween(requesterId, recipientId);
  if (existing?.status === "accepted") {
    return { ok: true, connection: existing };
  }
  if (existing?.status === "pending") {
    return { ok: true, connection: existing };
  }

  const now = new Date().toISOString();
  const connection: Connection = {
    id: existing?.id || newId(),
    requesterId,
    recipientId,
    status: "pending",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const rest = readAll().filter((c) => c.id !== connection.id);
  writeAll([connection, ...rest]);
  return { ok: true, connection };
}

export async function respondToConnection(
  connectionId: string,
  recipientId: string,
  accept: boolean,
): Promise<{ ok: true; connection?: Connection } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/connections/${encodeURIComponent(connectionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, accept }),
    });
    const data = (await res.json()) as {
      connection?: Connection;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error || "Could not update request." };
    }
    if (data.connection) {
      const rest = readAll().filter((c) => c.id !== data.connection!.id);
      writeAll([data.connection, ...rest]);
    }
    return { ok: true, connection: data.connection };
  } catch {
    // Local fallback
  }

  const all = readAll();
  const row = all.find((c) => c.id === connectionId);
  if (!row) return { ok: false, error: "Request not found." };
  if (row.recipientId !== recipientId) {
    return { ok: false, error: "Only the recipient can respond." };
  }
  row.status = accept ? "accepted" : "declined";
  row.updatedAt = new Date().toISOString();
  writeAll(all);
  return { ok: true, connection: row };
}

export function areConnected(a: string, b: string): boolean {
  return getConnectionBetween(a, b)?.status === "accepted";
}

export async function areConnectedAsync(a: string, b: string): Promise<boolean> {
  return (await getConnectionBetweenAsync(a, b))?.status === "accepted";
}

/** Pending requests where `userId` is the recipient. */
export function listPendingFor(userId: string): Connection[] {
  return readAll().filter(
    (c) => c.recipientId === userId && c.status === "pending",
  );
}

export async function listPendingForAsync(userId: string): Promise<Connection[]> {
  const all = await listConnectionsForAsync(userId);
  return all.filter((c) => c.recipientId === userId && c.status === "pending");
}

export async function listAcceptedForAsync(userId: string): Promise<Connection[]> {
  const all = await listConnectionsForAsync(userId);
  return all.filter((c) => c.status === "accepted");
}
