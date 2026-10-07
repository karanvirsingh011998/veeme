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

const MESSAGE_COLUMNS = "id, conversation_id, sender_id, body, created_at";

function mapMessage(m: DbMessage): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    body: m.body || "",
    createdAt: m.created_at,
    readAt: null,
  };
}

/**
 * Find or create a direct conversation using existing conversations tables.
 */
export async function sbGetOrCreateDirect(
  userA: string,
  userB: string,
): Promise<DirectConversation | null> {
  const db = getDataClient();
  if (!db) return null;

  const { data: partsA } = await db
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userA);

  const ids = ((partsA || []) as Array<{ conversation_id: string }>).map(
    (p) => p.conversation_id,
  );

  if (ids.length > 0) {
    const { data: members } = await db
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", ids);
    const grouped = new Map<string, string[]>();
    for (const row of (members || []) as Array<{
      conversation_id: string;
      user_id: string;
    }>) {
      const list = grouped.get(row.conversation_id) || [];
      list.push(row.user_id);
      grouped.set(row.conversation_id, list);
    }
    const matchId = [...grouped.entries()].find(
      ([, users]) => users.length === 2 && users.includes(userB),
    )?.[0];
    if (matchId) {
      const { data: conv } = await db
        .from("conversations")
        .select("id, type, created_at, updated_at")
        .eq("id", matchId)
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
    .select("id, type, created_at, updated_at")
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

  const ids = partRows.map((part) => part.conversation_id);
  const [{ data: convs }, { data: members }, { data: recent }] =
    await Promise.all([
      db
        .from("conversations")
        .select("id, type, created_at, updated_at")
        .in("id", ids),
      db
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", ids),
      db
        .from("messages")
        .select(MESSAGE_COLUMNS)
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(Math.min(ids.length * 40, 400)),
    ]);

  const convById = new Map(
    ((convs || []) as DbConversation[]).map((row) => [row.id, row]),
  );
  const usersByConv = new Map<string, string[]>();
  for (const row of (members || []) as Array<{
    conversation_id: string;
    user_id: string;
  }>) {
    const list = usersByConv.get(row.conversation_id) || [];
    list.push(row.user_id);
    usersByConv.set(row.conversation_id, list);
  }
  const messagesByConv = new Map<string, DbMessage[]>();
  for (const row of (recent || []) as DbMessage[]) {
    const list = messagesByConv.get(row.conversation_id) || [];
    list.push(row);
    messagesByConv.set(row.conversation_id, list);
  }

  const rows: ConversationSummary[] = [];
  for (const part of partRows) {
    const row = convById.get(part.conversation_id);
    const participantIds = usersByConv.get(part.conversation_id) || [];
    if (!row || participantIds.length !== 2) continue;
    const messages = (messagesByConv.get(part.conversation_id) || []).map(
      mapMessage,
    );
    const lastMessage = messages[0] ?? null;
    const lastReadAt = part.last_read_at;
    const unreadCount = messages.filter(
      (message) =>
        message.senderId !== userId &&
        (!lastReadAt || message.createdAt > lastReadAt),
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
  opts?: { limit?: number; before?: string; after?: string },
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const db = getDataClient();
  if (!db) return { messages: [], hasMore: false };

  const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 50);
  const scoped = db
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId) as unknown as {
    gt: (column: string, value: string) => {
      order: (
        column: string,
        opts: { ascending: boolean },
      ) => { limit: (count: number) => Promise<{ data: unknown }> };
    };
    lt: (column: string, value: string) => {
      order: (
        column: string,
        opts: { ascending: boolean },
      ) => { limit: (count: number) => Promise<{ data: unknown }> };
    };
    order: (
      column: string,
      opts: { ascending: boolean },
    ) => { limit: (count: number) => Promise<{ data: unknown }> };
  };

  if (opts?.after) {
    const { data } = await scoped
      .gt("created_at", opts.after)
      .order("created_at", { ascending: true })
      .limit(limit);
    return {
      messages: ((data || []) as DbMessage[]).map(mapMessage),
      hasMore: false,
    };
  }

  const pageQuery = opts?.before
    ? scoped.lt("created_at", opts.before)
    : scoped;
  const { data } = await pageQuery
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  const rows = (data || []) as DbMessage[];
  const hasMore = rows.length > limit;
  return {
    messages: rows.slice(0, limit).reverse().map(mapMessage),
    hasMore,
  };
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
    .select(MESSAGE_COLUMNS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Could not send message." };
  }

  await db
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return {
    ok: true,
    message: mapMessage(data as DbMessage),
  };
}

export async function sbGetConversation(
  id: string,
): Promise<DirectConversation | null> {
  const db = getDataClient();
  if (!db) return null;
  const { data: conv } = await db
    .from("conversations")
    .select("id, type, created_at, updated_at")
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
