"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { listConversationSummariesAsync } from "@/lib/chat/service";

type ChatUnreadContextValue = {
  /** Total unread messages across all chats */
  unreadTotal: number;
  /** Conversations with at least one unread message */
  unreadChats: number;
  refreshUnread: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

const POLL_MS = 15000;

/**
 * Polls unread chat counts app-wide so nav badges update without a full refresh.
 */
export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const userId = profile?.id || user?.id || "";
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadTotal(0);
      setUnreadChats(0);
      return;
    }
    const summaries = await listConversationSummariesAsync(userId);
    setUnreadTotal(summaries.reduce((sum, c) => sum + c.unreadCount, 0));
    setUnreadChats(summaries.filter((c) => c.unreadCount > 0).length);
  }, [userId]);

  useEffect(() => {
    if (loading || !userId) return;
    void refreshUnread();
    const timer = window.setInterval(() => void refreshUnread(), POLL_MS);
    const onFocus = () => void refreshUnread();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUnread();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loading, userId, refreshUnread]);

  const value = useMemo(
    () => ({ unreadTotal, unreadChats, refreshUnread }),
    [unreadTotal, unreadChats, refreshUnread],
  );

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) {
    return {
      unreadTotal: 0,
      unreadChats: 0,
      refreshUnread: async () => undefined,
    };
  }
  return ctx;
}
