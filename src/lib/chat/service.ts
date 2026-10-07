import { isSupabaseConfigured } from "@/lib/auth/config";
import { invalidateCache, loadSwr } from "@/lib/cache/client-cache";
import type {
  ChatMessage,
  ConversationSummary,
  DirectConversation,
} from "@/lib/chat/types";

export type { ChatMessage, ConversationSummary, DirectConversation };

const CONV_KEY = "vemee_direct_conversations_v1";
const MSG_KEY = "vemee_direct_messages_v1";
const READ_KEY = "vemee_chat_last_read_v1";

function useRemote() {
  return typeof window !== "undefined" && isSupabaseConfigured();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}_${Date.now()}`;
}

type LocalReadMap = Record<string, Record<string, string>>;

function readLocalReadMap(): LocalReadMap {
  return readJson<LocalReadMap>(READ_KEY, {});
}

function getLocalLastRead(userId: string, conversationId: string): string | null {
  return readLocalReadMap()[userId]?.[conversationId] ?? null;
}

function setLocalLastRead(userId: string, conversationId: string, at: string) {
  const map = readLocalReadMap();
  map[userId] = { ...(map[userId] || {}), [conversationId]: at };
  writeJson(READ_KEY, map);
}

function countUnreadLocal(
  messages: ChatMessage[],
  userId: string,
  lastReadAt: string | null,
): number {
  return messages.filter(
    (m) =>
      m.senderId !== userId &&
      (!lastReadAt || m.createdAt > lastReadAt) &&
      !m.readAt,
  ).length;
}

export function listConversationsFor(userId: string): DirectConversation[] {
  return readJson<DirectConversation[]>(CONV_KEY, [])
    .filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listConversationsForAsync(
  userId: string,
): Promise<DirectConversation[]> {
  const summaries = await listConversationSummariesAsync(userId);
  return summaries.map(
    ({ lastMessage: _l, unreadCount: _u, ...conv }) => conv,
  );
}

export async function listConversationSummariesAsync(
  userId: string,
): Promise<ConversationSummary[]> {
  if (!userId) return [];

  if (useRemote()) {
    return loadSwr(
      `chat-inbox:${userId}`,
      12_000,
      async () => {
        const res = await fetch(
          `/api/chat/conversations?userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) return [];
        const data = (await res.json()) as {
          conversations?: ConversationSummary[];
        };
        return data.conversations || [];
      },
    );
  }

  return listConversationsFor(userId).map((conversation) => {
    const messages = listMessages(conversation.id);
    const lastMessage = messages[messages.length - 1] ?? null;
    const lastReadAt = getLocalLastRead(userId, conversation.id);
    return {
      ...conversation,
      lastMessage,
      unreadCount: countUnreadLocal(messages, userId, lastReadAt),
    };
  });
}

export async function getUnreadTotalAsync(userId: string): Promise<number> {
  const summaries = await listConversationSummariesAsync(userId);
  return summaries.reduce((sum, c) => sum + c.unreadCount, 0);
}

/** Number of conversations that have at least one unread message. */
export async function getUnreadChatsCountAsync(userId: string): Promise<number> {
  const summaries = await listConversationSummariesAsync(userId);
  return summaries.filter((c) => c.unreadCount > 0).length;
}

export function getConversation(id: string): DirectConversation | null {
  return (
    readJson<DirectConversation[]>(CONV_KEY, []).find((c) => c.id === id) ??
    null
  );
}

export async function getConversationAsync(
  id: string,
): Promise<DirectConversation | null> {
  if (useRemote()) {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      conversation: DirectConversation | null;
    };
    return data.conversation;
  }
  return getConversation(id);
}

export async function getOrCreateDirectConversation(
  userA: string,
  userB: string,
): Promise<DirectConversation> {
  if (useRemote()) {
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userA, userB }),
    });
    const data = (await res.json()) as {
      conversation?: DirectConversation;
      error?: string;
    };
    if (!res.ok || !data.conversation) {
      throw new Error(data.error || "Could not open chat.");
    }
    return data.conversation;
  }

  const all = readJson<DirectConversation[]>(CONV_KEY, []);
  const existing = all.find(
    (c) =>
      c.participantIds.includes(userA) && c.participantIds.includes(userB),
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: DirectConversation = {
    id: newId("conv"),
    participantIds: [userA, userB],
    createdAt: now,
    updatedAt: now,
  };
  writeJson(CONV_KEY, [conversation, ...all]);
  return conversation;
}

export function listMessages(conversationId: string): ChatMessage[] {
  return readJson<ChatMessage[]>(MSG_KEY, [])
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listMessagesPage(
  conversationId: string,
  opts?: { before?: string; after?: string; limit?: number },
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const limit = opts?.limit ?? 40;
  if (useRemote()) {
    const params = new URLSearchParams({
      conversationId,
      limit: String(limit),
    });
    if (opts?.before) params.set("before", opts.before);
    if (opts?.after) params.set("after", opts.after);
    const res = await fetch(`/api/chat/messages?${params}`);
    if (!res.ok) return { messages: [], hasMore: false };
    const data = (await res.json()) as {
      messages?: ChatMessage[];
      hasMore?: boolean;
    };
    return { messages: data.messages || [], hasMore: Boolean(data.hasMore) };
  }

  const all = listMessages(conversationId);
  if (opts?.after) {
    return {
      messages: all.filter((message) => message.createdAt > opts.after!),
      hasMore: false,
    };
  }
  const older = opts?.before
    ? all.filter((message) => message.createdAt < opts.before!)
    : all;
  const page = older.slice(Math.max(older.length - limit, 0));
  return { messages: page, hasMore: older.length > limit };
}

export async function listMessagesAsync(
  conversationId: string,
): Promise<ChatMessage[]> {
  const page = await listMessagesPage(conversationId);
  return page.messages;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Write a message first." };

  if (useRemote()) {
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, senderId, body: text }),
    });
    const data = (await res.json()) as {
      message?: ChatMessage;
      error?: string;
    };
    if (!res.ok || !data.message) {
      return { ok: false, error: data.error || "Could not send message." };
    }
    invalidateCache("chat-inbox:");
    return { ok: true, message: data.message };
  }

  const conversation = getConversation(conversationId);
  if (!conversation) return { ok: false, error: "Conversation not found." };
  if (!conversation.participantIds.includes(senderId)) {
    return { ok: false, error: "You are not in this conversation." };
  }

  const message: ChatMessage = {
    id: newId("msg"),
    conversationId,
    senderId,
    body: text,
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  const messages = readJson<ChatMessage[]>(MSG_KEY, []);
  writeJson(MSG_KEY, [...messages, message]);

  const all = readJson<DirectConversation[]>(CONV_KEY, []);
  writeJson(
    CONV_KEY,
    all.map((c) =>
      c.id === conversationId ? { ...c, updatedAt: message.createdAt } : c,
    ),
  );

  return { ok: true, message };
}

/** Sync local-only helper. Prefer markConversationReadAsync. */
export function markConversationRead(
  conversationId: string,
  readerId: string,
): void {
  void markConversationReadAsync(conversationId, readerId);
}

export async function markConversationReadAsync(
  conversationId: string,
  readerId: string,
): Promise<void> {
  if (!conversationId || !readerId) return;

  if (useRemote()) {
    try {
      await fetch(
        `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: readerId }),
        },
      );
    } catch {
      // ignore network blips; next poll will retry after re-open
    }
    return;
  }

  const now = new Date().toISOString();
  setLocalLastRead(readerId, conversationId, now);
  const messages = readJson<ChatMessage[]>(MSG_KEY, []).map((m) => {
    if (
      m.conversationId === conversationId &&
      m.senderId !== readerId &&
      !m.readAt
    ) {
      return { ...m, readAt: now };
    }
    return m;
  });
  writeJson(MSG_KEY, messages);
}

export function unreadCount(conversationId: string, userId: string): number {
  const messages = listMessages(conversationId);
  return countUnreadLocal(
    messages,
    userId,
    getLocalLastRead(userId, conversationId),
  );
}

export function lastMessage(conversationId: string): ChatMessage | null {
  const msgs = listMessages(conversationId);
  return msgs[msgs.length - 1] ?? null;
}
