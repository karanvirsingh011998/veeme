import { getDataClient } from "@/lib/supabase/data";
import type { Connection, ConnectionStatus } from "./types";

type DbConnection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbConnection): Connection {
  return {
    id: row.id,
    requesterId: row.requester_id,
    recipientId: row.recipient_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function sbListConnectionsFor(
  userId: string,
): Promise<Connection[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data } = await db
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  return ((data || []) as DbConnection[]).map(mapRow);
}

export async function sbGetConnectionBetween(
  a: string,
  b: string,
): Promise<Connection | null> {
  const rows = await sbListConnectionsFor(a);
  return (
    rows.find(
      (c) =>
        (c.requesterId === a && c.recipientId === b) ||
        (c.requesterId === b && c.recipientId === a),
    ) ?? null
  );
}

export async function sbCreateConnection(
  requesterId: string,
  recipientId: string,
): Promise<{ ok: true; connection: Connection } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Database unavailable." };

  const existing = await sbGetConnectionBetween(requesterId, recipientId);
  if (existing?.status === "accepted" || existing?.status === "pending") {
    return { ok: true, connection: existing };
  }

  const now = new Date().toISOString();
  if (existing) {
    const { data, error } = await db
      .from("connections")
      .update({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: "pending",
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message || "Could not update request." };
    }
    return { ok: true, connection: mapRow(data as DbConnection) };
  }

  const { data, error } = await db
    .from("connections")
    .insert({
      requester_id: requesterId,
      recipient_id: recipientId,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not send request." };
  }
  return { ok: true, connection: mapRow(data as DbConnection) };
}

export async function sbRespondToConnection(
  connectionId: string,
  recipientId: string,
  accept: boolean,
): Promise<{ ok: true; connection: Connection } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Database unavailable." };

  const { data: existing } = await db
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle();
  const row = existing as DbConnection | null;
  if (!row) return { ok: false, error: "Request not found." };
  if (row.recipient_id !== recipientId) {
    return { ok: false, error: "Only the recipient can respond." };
  }

  const { data, error } = await db
    .from("connections")
    .update({
      status: accept ? "accepted" : "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not update request." };
  }
  return { ok: true, connection: mapRow(data as DbConnection) };
}
