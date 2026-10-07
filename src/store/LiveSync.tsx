"use client";

import { useEffect } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUserId } from "@/store/selectors/userSelectors";
import { selectActiveConversationId } from "@/store/selectors/chatSelectors";
import {
  fetchNotifications,
} from "@/store/slices/notificationSlice";
import {
  realtimeMessageReceived,
  refreshLatestMessages,
} from "@/store/slices/chatSlice";

const MESSAGE_POLL_MS = 5000;
const NOTIFICATION_POLL_MS = 20000;

/**
 * One realtime channel for the open conversation, plus the existing
 * active-thread poll when events are unavailable.
 */
export function ChatLiveSync() {
  const dispatch = useAppDispatch();
  const activeId = useAppSelector(selectActiveConversationId);

  useEffect(() => {
    if (!activeId) return;
    let stopped = false;
    const supabase = createClient();
    const pollId = window.setInterval(() => {
      void dispatch(refreshLatestMessages(activeId));
    }, MESSAGE_POLL_MS);

    const channel = supabase
      ? supabase
          .channel(`messages:${activeId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${activeId}`,
            },
            (payload) => {
              if (stopped) return;
              const row = payload.new as {
                id?: string;
                conversation_id?: string;
                sender_id?: string;
                body?: string | null;
                created_at?: string;
              };
              if (!row.id || !row.conversation_id || !row.sender_id || !row.created_at) return;
              const message: ChatMessage = {
                id: row.id,
                conversationId: row.conversation_id,
                senderId: row.sender_id,
                body: row.body || "",
                createdAt: row.created_at,
                readAt: null,
              };
              dispatch(realtimeMessageReceived(message));
            },
          )
          .subscribe()
      : null;

    return () => {
      stopped = true;
      window.clearInterval(pollId);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [activeId, dispatch]);

  return null;
}

/** Single notification fetch shared by every notification surface. */
export function NotificationSync() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUserId);

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchNotifications({ userId }));
    const timer = window.setInterval(() => {
      void dispatch(fetchNotifications({ userId, force: true }));
    }, NOTIFICATION_POLL_MS);
    const onFocus = () => {
      void dispatch(fetchNotifications({ userId, force: true }));
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [dispatch, userId]);

  return null;
}
