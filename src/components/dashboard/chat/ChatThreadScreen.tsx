"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const query = search.trim().toLowerCase();
  const visible = query
    ? messages.filter((message) => message.body.toLowerCase().includes(query))
    : messages;

  return (
    <div className={styles.sheetBackdrop} onClick={() => router.push("/dashboard/chat")}>
      <div
        className={styles.chatSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHead}>
          <h2 id="chat-sheet-title">{otherName} · Chat</h2>
          <Link href="/dashboard/chat" className={styles.sheetClose} aria-label="Close chat">
            ×
          </Link>
        </div>

        <div className={styles.chatHeader}>
          <span className={styles.threadAvatar} aria-hidden="true">
            {(otherName[0] || "V").toUpperCase()}
          </span>
          <div className={styles.chatWho}>
            <b>{otherName}</b>
            <small>Direct message</small>
          </div>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Chat options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋮
          </button>
          {menuOpen ? (
            <div className={styles.overflow}>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setMenuOpen(false);
                }}
              >
                Search
              </button>
            </div>
          ) : null}
        </div>

        {searchOpen ? (
          <input
            className={styles.chatSearch}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search this conversation…"
            aria-label="Search conversation"
          />
        ) : null}

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
          <p className={styles.chatHint}>
            Keep plans and meetup details in this chat.
          </p>
          {loading && messages.length === 0 ? (
            <ChatListSkeleton count={3} />
          ) : error && messages.length === 0 ? (
            <SectionError
              message={error}
              onRetry={() => void dispatch(openConversation({ conversationId, userId, force: true }))}
            />
          ) : visible.length === 0 ? (
            query ? <p className={styles.chatHint}>No messages match that search.</p> : null
          ) : (
            <>
              {hasMore && !query ? (
                <button
                  type="button"
                  className={styles.loadEarlier}
                  onClick={() => loadOlder()}
                  disabled={loadingOlder}
                >
                  {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
                </button>
              ) : null}
              {visible.map((message) => {
                const mine = message.senderId === userId;
                return (
                  <div
                    key={message.id}
                    className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs} ${message.pending || message.failed ? styles.bubblePending : ""}`}
                  >
                    {message.body}
                    {message.failed ? (
                      <button type="button" className={styles.retry} onClick={() => retryMessage(message)}>
                        Retry
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <form className={styles.composer} onSubmit={(event) => onSend(event)}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message..."
            aria-label="Message"
            maxLength={500}
          />
          <button type="submit">Send</button>
        </form>
        {error && messages.length > 0 ? <p className={styles.error}>{error}</p> : null}
      </div>
    </div>
  );
}
