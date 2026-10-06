import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import {
  sbCreateConnection,
  sbListConnectionsFor,
} from "@/lib/connections/supabase";
import {
  listDevConnections,
  upsertDevConnection,
} from "@/lib/connections/dev-store";
import type { Connection } from "@/lib/connections/types";

function newId() {
  return crypto.randomUUID();
}

/**
 * GET /api/connections?userId= — list connections for a user.
 * POST /api/connections — send a connect request { requesterId, recipientId }.
 */
export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  if (canUseSupabaseData()) {
    const connections = await sbListConnectionsFor(userId);
    return NextResponse.json({ connections });
  }

  const all = await listDevConnections();
  const connections = all.filter(
    (c) => c.requesterId === userId || c.recipientId === userId,
  );
  return NextResponse.json({ connections });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    requesterId?: string;
    recipientId?: string;
  };
  if (!body.requesterId || !body.recipientId) {
    return NextResponse.json(
      { error: "requesterId and recipientId are required." },
      { status: 400 },
    );
  }
  if (body.requesterId === body.recipientId) {
    return NextResponse.json(
      { error: "You can’t connect with yourself." },
      { status: 400 },
    );
  }

  if (canUseSupabaseData()) {
    const result = await sbCreateConnection(body.requesterId, body.recipientId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ connection: result.connection });
  }

  const all = await listDevConnections();
  const existing = all.find(
    (c) =>
      (c.requesterId === body.requesterId &&
        c.recipientId === body.recipientId) ||
      (c.requesterId === body.recipientId &&
        c.recipientId === body.requesterId),
  );
  if (existing?.status === "accepted" || existing?.status === "pending") {
    return NextResponse.json({ connection: existing });
  }

  const now = new Date().toISOString();
  const connection: Connection = {
    id: existing?.id || newId(),
    requesterId: body.requesterId,
    recipientId: body.recipientId,
    status: "pending",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await upsertDevConnection(connection);
  return NextResponse.json({ connection });
}
