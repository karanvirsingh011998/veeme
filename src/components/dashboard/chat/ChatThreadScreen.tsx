"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  getConversationAsync,
  listMessagesPage,
  markConversationReadAsync,
  sendMessage,
  type ChatMessage,
} from "@/lib/chat/service";
import { getPublicProfileCardAsync } from "@/lib/people/service";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import { ChatListSkeleton, SectionError } from "@/components/dashboard/ui/Skeletons";
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
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  function scrollMessagesToBottom(smooth = true) {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  async function loadOlder() {
    const oldest = messages.find((message) => !message.pending);
    if (!oldest || loadingOlder || !hasMore) return;
    const list = listRef.current;
    const previousHeight = list?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const page = await listMessagesPage(conversationId, {
        before: oldest.createdAt,
        limit: 40,
      });
      setHasMore(page.hasMore);
      setMessages((current) => {
        const ids = new Set(current.map((message) => message.id));
        const older = page.messages.filter((message) => !ids.has(message.id));
        return [...older, ...current];
      });
      requestAnimationFrame(() => {
        if (!list) return;
        list.scrollTop = list.scrollHeight - previousHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    stickToBottomRef.current = true;
    setLoading(true);

    async function openThread() {
      try {
        const [conversation, page] = await Promise.all([
          getConversationAsync(conversationId),
          listMessagesPage(conversationId, { limit: 40 }),
        ]);
        if (cancelled) return;
        setMessages(page.messages);
        setHasMore(page.hasMore);
        const otherId =
          conversation?.participantIds.find((id) => id !== userId) || "";
        if (otherId) {
          const person = await getPublicProfileCardAsync(otherId, userId);
          if (!cancelled) setOtherName(person?.name || "Member");
        }
        await markConversationReadAsync(conversationId, userId);
        void refreshUnread();
        setError(null);
      } catch {
        if (!cancelled) setError("Couldn't load this chat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void openThread();
    const timer = window.setInterval(() => {
      void listMessagesPage(conversationId, { limit: 40 }).then((page) => {
        if (cancelled) return;
        setHasMore(page.hasMore);
        setMessages((current) => {
          const pending = current.filter(
            (message) => message.pending || message.failed,
          );
          return [
            ...page.messages,
            ...pending.filter(
              (message) => !page.messages.some((item) => item.id === message.id),
            ),
          ];
        });
      });
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [conversationId, refreshUnread, userId]);

  useEffect(() => {
    if (!loading && stickToBottomRef.current) {
      scrollMessagesToBottom(false);
    }
  }, [messages.length, loading]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const body = text.trim();
    if (!body) return;
    setError(null);
    const tempId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: userId,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
      pending: true,
    };
    stickToBottomRef.current = true;
    setMessages((current) => [...current, optimistic]);
    setText("");
    const result = await sendMessage(conversationId, userId, body);
    if (!result.ok) {
      setMessages((current) =>
        current.map((message) =>
          message.id === tempId
            ? { ...message, pending: false, failed: true }
            : message,
        ),
      );
      setError(result.error);
      return;
    }
    setMessages((current) =>
      current.map((message) => (message.id === tempId ? result.message : message)),
    );
    void refreshUnread();
  }

  async function retryMessage(message: ChatMessage) {
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, pending: true, failed: false } : item,
      ),
    );
    const result = await sendMessage(conversationId, userId, message.body);
    if (!result.ok) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, pending: false, failed: true }
            : item,
        ),
      );
      setError(result.error);
      return;
    }
    setMessages((current) =>
      current.map((item) => (item.id === message.id ? result.message : item)),
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

      <div
        className={styles.messages}
        ref={listRef}
        onScroll={() => {
          const list = listRef.current;
          if (!list) return;
          stickToBottomRef.current =
            list.scrollHeight - list.scrollTop - list.clientHeight < 80;
          if (list.scrollTop < 40) void loadOlder();
        }}
      >
        {loading && messages.length === 0 ? (
          <ChatListSkeleton count={3} />
        ) : error && messages.length === 0 ? (
          <SectionError
            message={error}
            onRetry={() => {
              setLoading(true);
              void listMessagesPage(conversationId, { limit: 40 }).then((page) => {
                setMessages(page.messages);
                setHasMore(page.hasMore);
                setLoading(false);
                setError(null);
              });
            }}
          />
        ) : messages.length === 0 ? (
          <p className={styles.sub}>
            No messages yet. Say hello and coordinate the plan.
          </p>
        ) : (
          <>
            {hasMore ? (
              <button
                type="button"
                className={styles.sub}
                onClick={() => void loadOlder()}
                disabled={loadingOlder}
              >
                {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
              </button>
            ) : null}
            {messages.map((message) => {
              const mine = message.senderId === userId;
              return (
                <div
                  key={message.id}
                  className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs} ${message.pending || message.failed ? styles.bubblePending : ""}`}
                >
                  {message.body}
                  <span className={styles.bubbleTime}>
                    {message.failed
                      ? "Failed"
                      : message.pending
                        ? "Sending…"
                        : new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                  </span>
                  {message.failed ? (
                    <button type="button" onClick={() => void retryMessage(message)}>
                      Retry
                    </button>
                  ) : null}
                </div>
              );
            })}
          </>
        )}
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
