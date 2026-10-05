"use client";

import { useMemo, useState } from "react";
import { CHAT_THREADS } from "@/lib/dashboard/demo-data";
import styles from "./app-ui.module.css";

/**
 * Chat inbox — ready for Supabase Realtime later.
 */
export function ChatScreen() {
  const [tab, setTab] = useState<"All" | "People" | "Groups">("All");

  const threads = useMemo(() => {
    if (tab === "People") return CHAT_THREADS.filter((t) => t.type === "people");
    if (tab === "Groups") return CHAT_THREADS.filter((t) => t.type === "groups");
    return CHAT_THREADS;
  }, [tab]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Chat</div>
        <button type="button" className={styles.iconBtn} aria-label="New chat">
          ＋
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.chips}>
          {(["All", "People", "Groups"] as const).map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${tab === c ? styles.chipActive : ""}`}
              onClick={() => setTab(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {threads.length === 0 ? (
          <p className={styles.small}>No conversations yet.</p>
        ) : (
          threads.map((thread) => (
            <button key={thread.name} type="button" className={styles.listBtn}>
              <span className={styles.listIcon} aria-hidden="true">
                {thread.avatar}
              </span>
              <span className={styles.listMeta}>
                <b>{thread.name}</b>
                <p>{thread.message}</p>
              </span>
              <span className={styles.small}>{thread.time}</span>
              {thread.unread ? (
                <span className={styles.unread} aria-label="Unread" />
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}