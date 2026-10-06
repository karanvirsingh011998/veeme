import { getDataClient } from "@/lib/supabase/data";
import type {
  ChatMessage,
  ConversationSummary,
  DirectConversation,
} from "@/lib/chat/types";

type DbConversation = {
  id: string;
  type: string;
  created_at: string;
  updated_at: string;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

/**
 * Find or create a direct conversation using existing conversations tables.
 */
export async function sbGetOrCreateDirect(
  userA: string,
  userB: string,
): Promise<DirectConversation | null> {
  const db = getDataClient();
  if (!db) return null;

  // Find conversations for userA, then check if userB is also a participant.
  const { data: partsA } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userA);

  const ids = ((partsA || []) as Array<{ conversation_id: string }>).map(
    (p) => p.conversation_id,
  );

  for (const conversationId of ids) {
    const { data: parts } = await db
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);
    const users = ((parts || []) as Array<{ user_id: string }>).map(
      (p) => p.user_id,
    );
    if (users.includes(userB) && users.length === 2) {
      const { data: conv } = await db
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();
      if (conv) {
        const row = conv as DbConversation;
        return {
          id: row.id,
          participantIds: [userA, userB],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    }
  }

  const { data: created, error } = await db
    .from("conversations")
    .insert({
      type: "direct",
      created_by: userA,
    })
    .select("*")
    .single();

  if (error || !created) return null;
  const row = created as DbConversation;

  await db.from("conversation_participants").insert([
    { conversation_id: row.id, user_id: userA },
    { conversation_id: row.id, user_id: userB },
  ]);

  return {
    id: row.id,
    participantIds: [userA, userB],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function sbListConversationsFor(
  userId: string,
): Promise<DirectConversation[]> {
  const summaries = await sbListConversationSummariesFor(userId);
  return summaries.map(
    ({ lastMessage: _last, unreadCount: _unread, ...conv }) => conv,
  );
}

/**
 * Conversations with last message + unread count (via last_read_at).
 */
export async function sbListConversationSummariesFor(
  userId: string,
): Promise<ConversationSummary[]> {
  const db = getDataClient();
  if (!db) return [];

  const { data: parts } = await db
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  const partRows = (parts || []) as Array<{
    conversation_id: string;
    last_read_at: string | null;
  }>;
  if (partRows.length === 0) return [];

  const rows: ConversationSummary[] = [];
  for (const part of partRows) {
    const id = part.conversation_id;
    const { data: conv } = await db
      .from("conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!conv) continue;
    const { data: members } = await db
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", id);
    const participantIds = ((members || []) as Array<{ user_id: string }>).map(
      (m) => m.user_id,
    );
    if (participantIds.length !== 2) continue;
    const row = conv as DbConversation;
    const messages = await sbListMessages(id);
    const lastMessage = messages[messages.length - 1] ?? null;
    const lastReadAt = part.last_read_at;
    const unreadCount = messages.filter(
      (m) =>
        m.senderId !== userId &&
        (!lastReadAt || m.createdAt > lastReadAt),
    ).length;
    rows.push({
      id: row.id,
      participantIds: [participantIds[0], participantIds[1]],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessage,
      unreadCount,
    });
  }

  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function sbMarkConversationRead(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const db = getDataClient();
  if (!db) return false;
  const now = new Date().toISOString();
  const { error } = await db
    .from("conversation_participants")
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
  return !error;
}

export async function sbTotalUnreadFor(userId: string): Promise<number> {
  const summaries = await sbListConversationSummariesFor(userId);
  return summaries.reduce((sum, c) => sum + c.unreadCount, 0);
}

export async function sbListMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const db = getDataClient();
  if (!db) return [];
  const { data } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  return ((data || []) as DbMessage[]).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    body: m.body || "",
    createdAt: m.created_at,
    readAt: null,
  }));
}

export async function sbSendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const db = getDataClient();
  if (!db) return { ok: false, error: "Supabase is not configured." };

  const { data, error } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim(),
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not send message." };
  }

  await db
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  const m = data as DbMessage;
  return {
    ok: true,
    message: {
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      body: m.body || "",
      createdAt: m.created_at,
      readAt: null,
    },
  };
}

export async function sbGetConversation(
  id: string,
): Promise<DirectConversation | null> {
  const db = getDataClient();
  if (!db) return null;
  const { data: conv } = await db
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!conv) return null;
  const { data: members } = await db
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", id);
  const participantIds = ((members || []) as Array<{ user_id: string }>).map(
    (m) => m.user_id,
  );
  if (participantIds.length < 2) return null;
  const row = conv as DbConversation;
  return {
    id: row.id,
    participantIds: [participantIds[0], participantIds[1]],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
