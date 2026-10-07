"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthLoading } from "@/store/selectors/authSelectors";
import {
  selectUnreadChats,
  selectUnreadTotal,
} from "@/store/selectors/chatSelectors";
import { selectCurrentUserId } from "@/store/selectors/userSelectors";
import { fetchConversations } from "@/store/slices/chatSlice";

const POLL_MS = 15000;

/**
 * Keeps inbox unread counts in Redux so the sidebar and inbox share one fetch.
 */
export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const userId = useAppSelector(selectCurrentUserId);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    await dispatch(fetchConversations({ userId, force: true }));
  }, [dispatch, userId]);

  useEffect(() => {
    if (loading || !userId) return;
    void dispatch(fetchConversations({ userId }));
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
  }, [dispatch, loading, refreshUnread, userId]);

  return <>{children}</>;
}

export function useChatUnread() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUserId);
  const unreadTotal = useAppSelector(selectUnreadTotal);
  const unreadChats = useAppSelector(selectUnreadChats);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    await dispatch(fetchConversations({ userId, force: true }));
  }, [dispatch, userId]);

  return { unreadTotal, unreadChats, refreshUnread };
}
