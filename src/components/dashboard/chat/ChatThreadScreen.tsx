"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { type ChatMessage } from "@/lib/chat/service";
import { ChatListSkeleton, SectionError } from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectChatError,
  selectHasMoreMessages,
  selectLoadingOlder,
  selectMessagesForConversation,
  selectPeerName,
  selectThreadLoading,
} from "@/store/selectors/chatSelectors";
import {
  loadOlderMessages,
  markOutgoingPending,
  openConversation,
  queueOutgoing,
  sendOutgoingMessage,
  setActiveConversation,
} from "@/store/slices/chatSlice";
import styles from "../social.module.css";

type ChatThreadScreenProps = {
  conversationId: string;
};

/**
 * 1:1 messaging thread. Messages come from the Redux cache so a
 * previously opened conversation renders before the network returns.
 */
export function ChatThreadScreen({ conversationId }: ChatThreadScreenProps) {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const messages = useAppSelector((state) =>
    selectMessagesForConversation(state, conversationId),
  );
  const loading = useAppSelector((state) => selectThreadLoading(state, conversationId));
  const hasMore = useAppSelector((state) => selectHasMoreMessages(state, conversationId));
  const loadingOlder = useAppSelector((state) => selectLoadingOlder(state, conversationId));
  const otherName = useAppSelector((state) => selectPeerName(state, conversationId));
  const error = useAppSelector(selectChatError);
  const [text, setText] = useState("");
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

  function loadOlder() {
    const oldest = messages.find((message) => !message.pending);
    if (!oldest || loadingOlder || !hasMore) return;
    const list = listRef.current;
    const previousHeight = list?.scrollHeight ?? 0;
    void dispatch(
      loadOlderMessages({ conversationId, before: oldest.createdAt }),
    ).then(() => {
      requestAnimationFrame(() => {
        if (!list) return;
        list.scrollTop = list.scrollHeight - previousHeight;
      });
    });
  }

  useEffect(() => {
    if (!userId) return;
    stickToBottomRef.current = true;
    dispatch(setActiveConversation(conversationId));
    void dispatch(openConversation({ conversationId, userId }));
    return () => {
      dispatch(setActiveConversation(null));
    };
  }, [conversationId, dispatch, userId]);

  useEffect(() => {
    if (!loading && stickToBottomRef.current) {
      scrollMessagesToBottom(false);
    }
  }, [messages.length, loading]);

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const body = text.trim();
    if (!body) return;
    const tempId = `temp-${Date.now()}`;
    stickToBottomRef.current = true;
    dispatch(
      queueOutgoing({
        id: tempId,
        conversationId,
        senderId: userId,
        body,
        createdAt: new Date().toISOString(),
      }),
    );
    setText("");
    void dispatch(sendOutgoingMessage({ conversationId, userId, body, tempId }));
  }

  function retryMessage(message: ChatMessage) {
    dispatch(markOutgoingPending({ conversationId, id: message.id }));
    void dispatch(
      sendOutgoingMessage({
        conversationId,
        userId,
        body: message.body,
        tempId: message.id,
      }),
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
          if (list.scrollTop < 40) loadOlder();
        }}
      >
        {loading && messages.length === 0 ? (
          <ChatListSkeleton count={3} />
        ) : error && messages.length === 0 ? (
          <SectionError
            message={error}
            onRetry={() => void dispatch(openConversation({ conversationId, userId, force: true }))}
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
                onClick={() => loadOlder()}
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
                    <button type="button" onClick={() => retryMessage(message)}>
                      Retry
                    </button>
                  ) : null}
                </div>
              );
            })}
          </>
        )}
      </div>

      <form className={styles.composer} onSubmit={(e) => onSend(e)}>
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
      {error && messages.length > 0 ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
