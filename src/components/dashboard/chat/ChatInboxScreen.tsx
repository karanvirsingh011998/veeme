"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import { ChatListSkeleton, SectionError } from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectConversations,
  selectConversationsStatus,
  selectParticipantNames,
} from "@/store/selectors/chatSelectors";
import { fetchConversations } from "@/store/slices/chatSlice";
import styles from "../social.module.css";
import ui from "../app-ui.module.css";

/**
 * 1:1 chat inbox — shows unread message counts per chat + polls for updates.
 */
export function ChatInboxScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const { unreadTotal, unreadChats } = useChatUnread();
  const conversations = useAppSelector(selectConversations);
  const names = useAppSelector(selectParticipantNames);
  const status = useAppSelector(selectConversationsStatus);
  const loading = status !== "succeeded" && status !== "failed" && conversations.length === 0;

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchConversations({ userId }));
  }, [dispatch, userId]);

  const rows = conversations
    .map((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== userId) || "";
      const last = conversation.lastMessage;
      return {
        conversation,
        name: names[otherId] || "Member",
        preview: last?.body || "No messages yet",
        time: last
          ? new Date(last.createdAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          : "",
        unread: conversation.unreadCount,
      };
    })
    .sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return b.conversation.updatedAt.localeCompare(a.conversation.updatedAt);
    });

  return (
    <div className={ui.page}>
      <header className={ui.header}>
        <div>
          <div className={ui.logo}>Chat</div>
          {!loading && unreadTotal > 0 ? (
            <p className={ui.small} style={{ margin: "4px 0 0" }}>
              {unreadChats} unread {unreadChats === 1 ? "chat" : "chats"} ·{" "}
              {unreadTotal} unread {unreadTotal === 1 ? "message" : "messages"}
            </p>
          ) : null}
        </div>
        <Link href="/dashboard/people" className={ui.iconBtn} aria-label="Find people">
          ＋
        </Link>
      </header>

      <div className={ui.content}>
        {loading && rows.length === 0 ? (
          <ChatListSkeleton />
        ) : status === "failed" && rows.length === 0 ? (
          <SectionError
            message="Couldn't load chats."
            onRetry={() => void dispatch(fetchConversations({ userId, force: true }))}
          />
        ) : rows.length === 0 ? (
          <div className={styles.empty}>
            <h3>Your conversations will appear here.</h3>
            <p>Connect with someone and start a conversation.</p>
            <div className={styles.emptyActions}>
              <Link
                href="/dashboard/people"
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Explore People
              </Link>
            </div>
          </div>
        ) : (
          rows.map((row) => {
            const isUnread = row.unread > 0;
            return (
              <Link
                key={row.conversation.id}
                href={`/dashboard/chat/${row.conversation.id}`}
                className={`${ui.listBtn} ${isUnread ? ui.listBtnUnread : ""}`}
              >
                <span className={ui.listIcon} aria-hidden="true">
                  {(row.name[0] || "V").toUpperCase()}
                </span>
                <span
                  className={`${ui.listMeta} ${isUnread ? ui.listMetaUnread : ""}`}
                >
                  <b>{row.name}</b>
                  <p>{row.preview}</p>
                </span>
                <span className={ui.listSide}>
                  <span className={ui.small}>{row.time}</span>
                  {isUnread ? (
                    <span
                      className={ui.unreadCount}
                      aria-label={`${row.unread} unread messages`}
                    >
                      {row.unread > 9 ? "9+" : row.unread}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
