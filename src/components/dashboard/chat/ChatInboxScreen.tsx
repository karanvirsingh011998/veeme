"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { NotificationBell } from "@/components/dashboard/notifications/NotificationBell";
import { ChatListSkeleton, SectionError } from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectConversations,
  selectConversationsStatus,
  selectParticipantNames,
} from "@/store/selectors/chatSelectors";
import { selectOwnedCommunities } from "@/store/selectors/sharedSelectors";
import { fetchConversations } from "@/store/slices/chatSlice";
import { fetchOwnedCommunities } from "@/store/slices/communitiesSlice";
import styles from "../home.module.css";

type ChatMode = "all" | "people" | "communities";

type ChatInboxProps = {
  embedded?: boolean;
};

/**
 * Chat inbox — people and communities in one list.
 */
export function ChatInboxScreen({ embedded = false }: ChatInboxProps) {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const conversations = useAppSelector(selectConversations);
  const names = useAppSelector(selectParticipantNames);
  const status = useAppSelector(selectConversationsStatus);
  const communities = useAppSelector(selectOwnedCommunities);
  const [mode, setMode] = useState<ChatMode>("all");
  const loading = status !== "succeeded" && status !== "failed" && conversations.length === 0;

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchConversations({ userId }));
    void dispatch(fetchOwnedCommunities({ userId }));
  }, [dispatch, userId]);

  const rows = conversations
    .map((conversation) => {
      const otherId = conversation.participantIds.find((id) => id !== userId) || "";
      const last = conversation.lastMessage;
      return {
        conversation,
        name: names[otherId] || "Member",
        preview: last?.body || "No messages yet",
        unread: conversation.unreadCount,
      };
    })
    .sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return b.conversation.updatedAt.localeCompare(a.conversation.updatedAt);
    });

  const showPeople = mode !== "communities";
  const showCommunities = mode !== "people";

  return (
    <div className={embedded ? styles.flowEmbed : styles.flow}>
      <header className={styles.pageHead}>
        <div>
          <h1>Chats</h1>
          <p>People and communities in one place.</p>
        </div>
        <NotificationBell />
      </header>

      <div className={styles.modes} role="tablist" aria-label="Chat types">
        {(
          [
            ["all", "All"],
            ["people", "People"],
            ["communities", "Communities"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? styles.modeOn : undefined}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {showPeople && loading && rows.length === 0 ? <ChatListSkeleton /> : null}
      {showPeople && status === "failed" && rows.length === 0 ? (
        <SectionError
          message="Couldn't load chats."
          onRetry={() => void dispatch(fetchConversations({ userId, force: true }))}
        />
      ) : null}

      {showPeople && !loading && rows.length === 0 && status !== "failed" ? (
        <div className={styles.empty}>
          <h3>Your conversations will appear here.</h3>
          <p>Connect with someone and start a conversation.</p>
          <Link href="/dashboard/people" className={`${styles.btn} ${styles.reset}`}>
            Meet people
          </Link>
        </div>
      ) : null}

      {showPeople
        ? rows.map((row) => (
            <Link
              key={row.conversation.id}
              href={`/dashboard/chat/${row.conversation.id}`}
              className={styles.chatRow}
            >
              <span className={styles.chatAvatar} aria-hidden="true">
                {(row.name[0] || "V").toUpperCase()}
              </span>
              <span className={styles.chatCopy}>
                <b>{row.name}</b>
                <small>{row.preview}</small>
              </span>
              {row.unread > 0 ? (
                <span className={styles.unread} aria-label={`${row.unread} unread messages`}>
                  {row.unread > 9 ? "9+" : row.unread}
                </span>
              ) : null}
            </Link>
          ))
        : null}

      {showCommunities && communities.length === 0 ? (
        <p className={styles.quiet}>Join a community to see its group chat here.</p>
      ) : null}

      {showCommunities
        ? communities.map((community) => (
            <Link key={community.id} href="/dashboard/community" className={styles.chatRow}>
              <span className={styles.chatAvatar} aria-hidden="true">
                {community.icon}
              </span>
              <span className={styles.chatCopy}>
                <b>{community.name}</b>
                <small>Community · {community.memberCount} members</small>
              </span>
            </Link>
          ))
        : null}
    </div>
  );
}
