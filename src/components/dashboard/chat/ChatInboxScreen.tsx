"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  listConversationSummariesAsync,
  type ConversationSummary,
} from "@/lib/chat/service";
import { getPublicProfileCardAsync } from "@/lib/people/service";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
import styles from "../social.module.css";
import ui from "../app-ui.module.css";

type InboxRow = {
  conversation: ConversationSummary;
  name: string;
  preview: string;
  time: string;
  unread: number;
};

/**
 * 1:1 chat inbox — shows unread message counts per chat + polls for updates.
 */
export function ChatInboxScreen() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const { unreadTotal, unreadChats, refreshUnread } = useChatUnread();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (isInitial = false) => {
      if (!userId) return;
      if (isInitial) setLoading(true);
      try {
        const conversations = await listConversationSummariesAsync(userId);
        const next: InboxRow[] = [];
        for (const conversation of conversations) {
          const otherId =
            conversation.participantIds.find((id) => id !== userId) || "";
          const person = await getPublicProfileCardAsync(otherId, userId);
          const last = conversation.lastMessage;
          next.push({
            conversation,
            name: person?.name || "Member",
            preview: last?.body || "No messages yet",
            time: last
              ? new Date(last.createdAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "",
            unread: conversation.unreadCount,
          });
        }
        // Unread chats first, then recent activity.
        next.sort((a, b) => {
          if (a.unread !== b.unread) return b.unread - a.unread;
          return b.conversation.updatedAt.localeCompare(a.conversation.updatedAt);
        });
        setRows(next);
        void refreshUnread();
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [userId, refreshUnread],
  );

  useEffect(() => {
    if (!userId) return;
    void load(true);
    const timer = window.setInterval(() => void load(false), 4000);
    const onFocus = () => void load(false);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, load]);

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
        {loading ? (
          <ScreenLoading message="Loading conversations…" />
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
