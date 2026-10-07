import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { invalidateCache } from "@/lib/cache/client-cache";
import {
  getConversationAsync,
  listConversationSummariesAsync,
  listMessagesPage,
  markConversationReadAsync,
  sendMessage,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/chat/service";
import { buildCreatorMapAsync, getPublicProfileCardAsync } from "@/lib/people/service";
import { clientSessionCleared } from "@/store/sessionActions";
import { singleFlight } from "@/store/singleFlight";
import { CHAT_CACHE_MS, isFresh, type RequestStatus } from "@/store/status";

type ChatState = {
  conversations: ConversationSummary[];
  participantNames: Record<string, string>;
  conversationsStatus: RequestStatus;
  conversationsFetchedAt: number;
  activeConversationId: string | null;
  messagesByConversation: Record<string, ChatMessage[]>;
  messagesFetchedAt: Record<string, number>;
  hasMoreMessages: Record<string, boolean>;
  loadingByConversation: Record<string, RequestStatus>;
  loadingOlderMessages: Record<string, boolean>;
  pendingSends: number;
  error: string | null;
  peerNames: Record<string, string>;
};

const initialState: ChatState = {
  conversations: [],
  participantNames: {},
  conversationsStatus: "idle",
  conversationsFetchedAt: 0,
  activeConversationId: null,
  messagesByConversation: {},
  messagesFetchedAt: {},
  hasMoreMessages: {},
  loadingByConversation: {},
  loadingOlderMessages: {},
  pendingSends: 0,
  error: null,
  peerNames: {},
};

const EMPTY_MESSAGES: ChatMessage[] = [];

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function sameMessages(a: ChatMessage[], b: ChatMessage[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id || a[i].pending !== b[i].pending || a[i].failed !== b[i].failed) {
      return false;
    }
  }
  return true;
}

function applyLatestPage(existing: ChatMessage[], page: ChatMessage[]) {
  const pageIds = new Set(page.map((message) => message.id));
  const oldest = page[0]?.createdAt ?? null;
  const kept = existing.filter((message) => {
    if (pageIds.has(message.id)) return false;
    if (message.pending || message.failed) {
      return !page.some(
        (item) => item.senderId === message.senderId && item.body === message.body,
      );
    }
    if (!oldest) return false;
    return message.createdAt < oldest;
  });
  return sortMessages([...kept, ...page]);
}

function replaceTemp(list: ChatMessage[], tempId: string, message: ChatMessage) {
  const without = list.filter(
    (item) =>
      item.id !== tempId &&
      item.id !== message.id &&
      !(
        (item.pending || item.failed) &&
        item.senderId === message.senderId &&
        item.body === message.body
      ),
  );
  return sortMessages([...without, message]);
}

type ConversationArgs = { userId: string; force?: boolean };

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (arg: ConversationArgs) => {
    return singleFlight(`chat:conversations:${arg.userId}`, async () => {
      const conversations = await listConversationSummariesAsync(arg.userId);
      const names = await buildCreatorMapAsync(
        conversations.map(
          (conversation) =>
            conversation.participantIds.find((id) => id !== arg.userId) || "",
        ),
      );
      const participantNames: Record<string, string> = {};
      for (const [id, creator] of names) participantNames[id] = creator.name;
      return { conversations, participantNames };
    });
  },
  {
    condition: (arg, { getState }) => {
      if (!arg.userId) return false;
      const chat = (getState() as { chat: ChatState }).chat;
      if (chat.conversationsStatus === "loading") return false;
      if (
        !arg.force &&
        chat.conversationsStatus === "succeeded" &&
        isFresh(chat.conversationsFetchedAt, CHAT_CACHE_MS)
      ) {
        return false;
      }
      return true;
    },
  },
);

export const openConversation = createAsyncThunk(
  "chat/open",
  async (arg: { conversationId: string; userId: string; force?: boolean }, { getState, dispatch }) => {
    const chat = (getState() as { chat: ChatState }).chat;
    const cached = Boolean(chat.messagesFetchedAt[arg.conversationId]);
    const fresh =
      cached && isFresh(chat.messagesFetchedAt[arg.conversationId] || 0, CHAT_CACHE_MS);
    let peerName = chat.peerNames[arg.conversationId] || "";
    if (!peerName) {
      const conversation = await getConversationAsync(arg.conversationId);
      const otherId = conversation?.participantIds.find((id) => id !== arg.userId) || "";
      if (otherId) {
        const person = await getPublicProfileCardAsync(otherId, arg.userId);
        peerName = person?.name || "Member";
      }
    }
    const page =
      fresh && !arg.force
        ? null
        : await listMessagesPage(arg.conversationId, { limit: 40 });
    void markConversationReadAsync(arg.conversationId, arg.userId).then(() => {
      invalidateCache("chat-inbox:");
      void dispatch(fetchConversations({ userId: arg.userId, force: true }));
    });
    return {
      conversationId: arg.conversationId,
      messages: page?.messages ?? null,
      hasMore: page?.hasMore ?? null,
      peerName,
    };
  },
);

export const refreshLatestMessages = createAsyncThunk(
  "chat/refreshLatest",
  async (conversationId: string) => {
    const page = await listMessagesPage(conversationId, { limit: 40 });
    return { conversationId, messages: page.messages, hasMore: page.hasMore };
  },
);

export const loadOlderMessages = createAsyncThunk(
  "chat/loadOlder",
  async (arg: { conversationId: string; before: string }) => {
    const page = await listMessagesPage(arg.conversationId, {
      before: arg.before,
      limit: 40,
    });
    return {
      conversationId: arg.conversationId,
      messages: page.messages,
      hasMore: page.hasMore,
    };
  },
  {
    condition: (arg, { getState }) => {
      const chat = (getState() as { chat: ChatState }).chat;
      return !chat.loadingOlderMessages[arg.conversationId];
    },
  },
);

export const sendOutgoingMessage = createAsyncThunk(
  "chat/send",
  async (arg: {
    conversationId: string;
    userId: string;
    body: string;
    tempId: string;
  }) => {
    const result = await sendMessage(arg.conversationId, arg.userId, arg.body);
    if (!result.ok) throw new Error(result.error);
    invalidateCache("chat-inbox:");
    return {
      conversationId: arg.conversationId,
      tempId: arg.tempId,
      message: result.message,
    };
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      if (action.payload) state.error = null;
    },
    queueOutgoing(
      state,
      action: PayloadAction<{
        id: string;
        conversationId: string;
        senderId: string;
        body: string;
        createdAt: string;
      }>,
    ) {
      const message: ChatMessage = {
        id: action.payload.id,
        conversationId: action.payload.conversationId,
        senderId: action.payload.senderId,
        body: action.payload.body,
        createdAt: action.payload.createdAt,
        readAt: null,
        pending: true,
      };
      const current = state.messagesByConversation[action.payload.conversationId] || [];
      state.messagesByConversation[action.payload.conversationId] = sortMessages([
        ...current,
        message,
      ]);
      state.pendingSends += 1;
      state.error = null;
    },
    markOutgoingPending(state, action: PayloadAction<{ conversationId: string; id: string }>) {
      const list = state.messagesByConversation[action.payload.conversationId];
      if (!list) return;
      state.messagesByConversation[action.payload.conversationId] = list.map((message) =>
        message.id === action.payload.id
          ? { ...message, pending: true, failed: false }
          : message,
      );
      state.pendingSends += 1;
      state.error = null;
    },
    realtimeMessageReceived(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const current = state.messagesByConversation[message.conversationId] || [];
      const next = replaceTemp(current, message.id, message);
      if (!sameMessages(current, next)) {
        state.messagesByConversation[message.conversationId] = next;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        if (state.conversationsStatus !== "succeeded") {
          state.conversationsStatus = "loading";
        }
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
        state.participantNames = {
          ...state.participantNames,
          ...action.payload.participantNames,
        };
        state.conversationsStatus = "succeeded";
        state.conversationsFetchedAt = Date.now();
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        if (action.meta.condition) return;
        if (state.conversations.length === 0) {
          state.conversationsStatus = "failed";
        }
        state.error = "Couldn't load chats.";
      })
      .addCase(openConversation.pending, (state, action) => {
        const id = action.meta.arg.conversationId;
        state.activeConversationId = id;
        if (!state.messagesFetchedAt[id]) {
          state.loadingByConversation[id] = "loading";
        }
        state.error = null;
      })
      .addCase(openConversation.fulfilled, (state, action) => {
        const id = action.payload.conversationId;
        if (action.payload.messages) {
          const existing = state.messagesByConversation[id] || [];
          const next = applyLatestPage(existing, action.payload.messages);
          if (!sameMessages(existing, next)) {
            state.messagesByConversation[id] = next;
          }
          state.hasMoreMessages[id] = action.payload.hasMore ?? false;
          state.messagesFetchedAt[id] = Date.now();
        }
        if (action.payload.peerName) state.peerNames[id] = action.payload.peerName;
        state.loadingByConversation[id] = "succeeded";
      })
      .addCase(openConversation.rejected, (state, action) => {
        const id = action.meta.arg.conversationId;
        state.loadingByConversation[id] = "failed";
        state.error = "Couldn't load this chat.";
      })
      .addCase(refreshLatestMessages.fulfilled, (state, action) => {
        const id = action.payload.conversationId;
        const existing = state.messagesByConversation[id] || [];
        const next = applyLatestPage(existing, action.payload.messages);
        if (!sameMessages(existing, next)) {
          state.messagesByConversation[id] = next;
        }
        state.hasMoreMessages[id] = action.payload.hasMore;
        state.messagesFetchedAt[id] = Date.now();
        state.loadingByConversation[id] = "succeeded";
      })
      .addCase(loadOlderMessages.pending, (state, action) => {
        state.loadingOlderMessages[action.meta.arg.conversationId] = true;
      })
      .addCase(loadOlderMessages.fulfilled, (state, action) => {
        const id = action.payload.conversationId;
        const existing = state.messagesByConversation[id] || [];
        const ids = new Set(existing.map((message) => message.id));
        const older = action.payload.messages.filter((message) => !ids.has(message.id));
        state.messagesByConversation[id] = sortMessages([...older, ...existing]);
        state.hasMoreMessages[id] = action.payload.hasMore;
        state.loadingOlderMessages[id] = false;
      })
      .addCase(loadOlderMessages.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.loadingOlderMessages[action.meta.arg.conversationId] = false;
      })
      .addCase(sendOutgoingMessage.fulfilled, (state, action) => {
        const id = action.payload.conversationId;
        const existing = state.messagesByConversation[id] || [];
        state.messagesByConversation[id] = replaceTemp(
          existing,
          action.payload.tempId,
          action.payload.message,
        );
        state.pendingSends = Math.max(0, state.pendingSends - 1);
      })
      .addCase(sendOutgoingMessage.rejected, (state, action) => {
        const id = action.meta.arg.conversationId;
        const tempId = action.meta.arg.tempId;
        const existing = state.messagesByConversation[id] || [];
        state.messagesByConversation[id] = existing.map((message) =>
          message.id === tempId ? { ...message, pending: false, failed: true } : message,
        );
        state.pendingSends = Math.max(0, state.pendingSends - 1);
        state.error = action.error.message || "Could not send message.";
      })
      .addCase(clientSessionCleared, () => initialState);
  },
});

export const {
  setActiveConversation,
  queueOutgoing,
  markOutgoingPending,
  realtimeMessageReceived,
} = chatSlice.actions;

export function messagesFor(state: ChatState, conversationId: string) {
  return state.messagesByConversation[conversationId] ?? EMPTY_MESSAGES;
}

export const chatReducer = chatSlice.reducer;
