import { NextResponse } from "next/server";
import { canUseSupabaseData } from "@/lib/supabase/data";
import { sbRespondToConnection } from "@/lib/connections/supabase";
import {
  getDevConnection,
  upsertDevConnection,
} from "@/lib/connections/dev-store";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/connections/[id] — accept or decline { recipientId, accept }.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    recipientId?: string;
    accept?: boolean;
  };
  if (!id || !body.recipientId || typeof body.accept !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (canUseSupabaseData()) {
    const result = await sbRespondToConnection(
      id,
      body.recipientId,
      body.accept,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ connection: result.connection });
  }

  const existing = await getDevConnection(id);
  if (!existing) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (existing.recipientId !== body.recipientId) {
    return NextResponse.json(
      { error: "Only the recipient can respond." },
      { status: 403 },
    );
  }
  const connection = {
    ...existing,
    status: (body.accept ? "accepted" : "declined") as
      | "accepted"
      | "declined",
    updatedAt: new Date().toISOString(),
  };
  await upsertDevConnection(connection);
  return NextResponse.json({ connection });
}
