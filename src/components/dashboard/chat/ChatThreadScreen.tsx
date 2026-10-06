"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  getConversationAsync,
  listMessagesAsync,
  markConversationReadAsync,
  sendMessage,
  type ChatMessage,
} from "@/lib/chat/service";
import { getPublicProfileCardAsync } from "@/lib/people/service";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
import styles from "../social.module.css";

type ChatThreadScreenProps = {
  conversationId: string;
};

/**
 * 1:1 messaging thread — composer stays pinned; only the message list scrolls.
 */
export function ChatThreadScreen({ conversationId }: ChatThreadScreenProps) {
  const { user, profile } = useAuth();
  const { refreshUnread } = useChatUnread();
  const userId = profile?.id || user?.id || "";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherName, setOtherName] = useState("Chat");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function scrollMessagesToBottom(smooth = true) {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  async function reload(isInitial = false) {
    if (!userId) return;
    if (isInitial) setLoading(true);
    try {
      const conversation = await getConversationAsync(conversationId);
      if (!conversation) {
        setReady(true);
        return;
      }
      const otherId =
        conversation.participantIds.find((id) => id !== userId) || "";
      const person = await getPublicProfileCardAsync(otherId, userId);
      setOtherName(person?.name || "Member");
      setMessages(await listMessagesAsync(conversationId));
      await markConversationReadAsync(conversationId, userId);
      void refreshUnread();
      setReady(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  useEffect(() => {
    setReady(false);
    void reload(true);
    const timer = window.setInterval(() => void reload(false), 2500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId]);

  useEffect(() => {
    if (!loading && ready) {
      scrollMessagesToBottom(false);
    }
  }, [messages.length, loading, ready]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    const result = await sendMessage(conversationId, userId, text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setText("");
    await reload(false);
    scrollMessagesToBottom(true);
  }

  if (loading || !ready) {
    return (
      <div className={`${styles.page} ${styles.thread}`}>
        <div className={styles.threadHead}>
          <Link href="/dashboard/chat" className={styles.sub}>
            ←
          </Link>
          <strong>Chat</strong>
        </div>
        <ScreenLoading message="Loading chat…" />
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${styles.thread}`}>
      <div className={styles.threadHead}>
        <Link href="/dashboard/chat" className={styles.sub}>
          ←
        </Link>
        <strong>{otherName}</strong>
      </div>

      <div className={styles.messages} ref={listRef}>
        {messages.length === 0 ? (
          <p className={styles.sub}>
            No messages yet. Say hello and coordinate the plan.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === userId;
            return (
              <div
                key={message.id}
                className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}
              >
                {message.body}
                <span className={styles.bubbleTime}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className={styles.composer} onSubmit={(e) => void onSend(e)}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
          Send
        </button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
