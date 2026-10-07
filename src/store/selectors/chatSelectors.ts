import type { ChatMessage } from "@/lib/chat/types";
import type { RootState } from "@/store";

const EMPTY_MESSAGES: ChatMessage[] = [];

export const selectConversations = (state: RootState) => state.chat.conversations;

export const selectConversationsStatus = (state: RootState) =>
  state.chat.conversationsStatus;

export const selectChatError = (state: RootState) => state.chat.error;

export const selectParticipantNames = (state: RootState) => state.chat.participantNames;

export const selectActiveConversationId = (state: RootState) =>
  state.chat.activeConversationId;

export const selectUnreadTotal = (state: RootState) =>
  state.chat.conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

export const selectUnreadChats = (state: RootState) =>
  state.chat.conversations.filter((conversation) => conversation.unreadCount > 0).length;

export function selectMessagesForConversation(state: RootState, conversationId: string) {
  return state.chat.messagesByConversation[conversationId] ?? EMPTY_MESSAGES;
}

export function selectThreadLoading(state: RootState, conversationId: string) {
  if (state.chat.messagesFetchedAt[conversationId]) return false;
  return state.chat.loadingByConversation[conversationId] !== "failed";
}

export function selectHasMoreMessages(state: RootState, conversationId: string) {
  return Boolean(state.chat.hasMoreMessages[conversationId]);
}

export function selectLoadingOlder(state: RootState, conversationId: string) {
  return Boolean(state.chat.loadingOlderMessages[conversationId]);
}

export function selectPeerName(state: RootState, conversationId: string) {
  return state.chat.peerNames[conversationId] || "Chat";
}

export const selectSendingMessage = (state: RootState) => state.chat.pendingSends > 0;
