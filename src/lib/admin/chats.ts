import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/auth/config";

export type AdminConversationRow = {
  id: string;
  type: string;
  title: string | null;
  booking_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participant_count: number;
  message_count: number;
  last_message: string | null;
  last_message_at: string | null;
};

export type AdminMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  is_system: boolean;
  created_at: string;
  sender_name?: string | null;
};

type AnyClient = {
  from: (table: string) => AnyTable;
};

type AnyTable = {
  select: (cols: string, opts?: { count?: "exact"; head?: boolean }) => AnyBuilder;
};

type AnyBuilder = {
  eq: (col: string, value: string) => AnyBuilder;
  order: (col: string, opts: { ascending: boolean }) => AnyBuilder;
  limit: (n: number) => AnyBuilder;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  then: Promise<{
    data: Record<string, unknown>[] | null;
    error: unknown;
    count?: number | null;
  }>["then"];
};

function db(client: ReturnType<typeof createServiceClient>): AnyClient {
  return client as unknown as AnyClient;
}

/**
 * Lists conversations for admin chat oversight.
 */
export async function listAdminConversations(): Promise<AdminConversationRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServiceClient();
  if (!supabase) return [];

  const client = db(supabase);
  const { data, error } = await client
    .from("conversations")
    .select("id, type, title, booking_id, created_by, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const rows: AdminConversationRow[] = [];

  for (const raw of data) {
    const conversation = raw as {
      id: string;
      type: string;
      title: string | null;
      booking_id: string | null;
      created_by: string | null;
      created_at: string;
      updated_at: string;
    };

    const [{ count: participantCount }, { data: lastMessages }, { count: messageCount }] =
      await Promise.all([
        client
          .from("conversation_participants")
          .select("user_id", { count: "exact", head: true })
          .eq("conversation_id", conversation.id),
        client
          .from("messages")
          .select("body, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1),
        client
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversation.id),
      ]);

    const last = (lastMessages?.[0] || null) as {
      body: string | null;
      created_at: string;
    } | null;

    rows.push({
      ...conversation,
      participant_count: participantCount ?? 0,
      message_count: messageCount ?? 0,
      last_message: last?.body ?? null,
      last_message_at: last?.created_at ?? null,
    });
  }

  return rows;
}

/**
 * Fetches one conversation and its recent messages.
 */
export async function getAdminConversation(id: string): Promise<{
  conversation: AdminConversationRow | null;
  messages: AdminMessageRow[];
}> {
  if (!isSupabaseConfigured()) {
    return { conversation: null, messages: [] };
  }

  const supabase = createServiceClient();
  if (!supabase) return { conversation: null, messages: [] };

  const client = db(supabase);
  const { data: conversation } = await client
    .from("conversations")
    .select("id, type, title, booking_id, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) return { conversation: null, messages: [] };

  const { data: messageRows } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, body, image_url, is_system, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const messages = (messageRows || []) as AdminMessageRow[];
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];

  let senderMap = new Map<string, string | null>();
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name")
      .in("id", senderIds);

    senderMap = new Map(
      (profiles || []).map((p) => [
        p.id,
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          p.display_name ||
          null,
      ]),
    );
  }

  const [{ count: participantCount }, { count: messageCount }] = await Promise.all([
    client
      .from("conversation_participants")
      .select("user_id", { count: "exact", head: true })
      .eq("conversation_id", id),
    client
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", id),
  ]);

  const base = conversation as {
    id: string;
    type: string;
    title: string | null;
    booking_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    conversation: {
      ...base,
      participant_count: participantCount ?? 0,
      message_count: messageCount ?? messages.length,
      last_message: messages.at(-1)?.body ?? null,
      last_message_at: messages.at(-1)?.created_at ?? null,
    },
    messages: messages.map((message) => ({
      ...message,
      sender_name: senderMap.get(message.sender_id) ?? null,
    })),
  };
}
