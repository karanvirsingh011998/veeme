export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  /** Local-only until the server confirms the send. */
  pending?: boolean;
  failed?: boolean;
};

export type DirectConversation = {
  id: string;
  participantIds: [string, string];
  createdAt: string;
  updatedAt: string;
};

/** Inbox row with preview + unread derived from last_read_at. */
export type ConversationSummary = DirectConversation & {
  lastMessage: ChatMessage | null;
  unreadCount: number;
};
