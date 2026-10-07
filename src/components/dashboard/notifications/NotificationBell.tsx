"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { listConnectionsForAsync } from "@/lib/connections/service";
import type { Connection } from "@/lib/connections/types";
import type { PublicProfileDto } from "@/lib/people/types";
import styles from "./NotificationBell.module.css";

type NotificationKind = "request" | "accepted" | "declined";

type AppNotification = {
  id: string;
  kind: NotificationKind;
  actorId: string;
  actorName: string;
  message: string;
  href: string;
  at: string;
};

const POLL_MS = 20000;

function seenKey(userId: string) {
  return `vemee_notif_seen_v1:${userId}`;
}

function readSeen(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(seenKey(userId));
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function writeSeen(userId: string, ids: Set<string>) {
  localStorage.setItem(seenKey(userId), JSON.stringify([...ids]));
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toNotifications(
  userId: string,
  connections: Connection[],
  names: Record<string, string>,
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const connection of connections) {
    const nameFor = (id: string) => names[id] || "Someone";

    if (connection.recipientId === userId && connection.status === "pending") {
      const actorId = connection.requesterId;
      items.push({
        id: `${connection.id}:request`,
        kind: "request",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} sent you a chat request`,
        href: "/dashboard/people",
        at: connection.updatedAt || connection.createdAt,
      });
      continue;
    }

    if (connection.requesterId === userId && connection.status === "accepted") {
      const actorId = connection.recipientId;
      items.push({
        id: `${connection.id}:accepted`,
        kind: "accepted",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} accepted your request`,
        href: `/dashboard/people/${actorId}`,
        at: connection.updatedAt || connection.createdAt,
      });
      continue;
    }

    if (connection.requesterId === userId && connection.status === "declined") {
      const actorId = connection.recipientId;
      items.push({
        id: `${connection.id}:declined`,
        kind: "declined",
        actorId,
        actorName: nameFor(actorId),
        message: `${nameFor(actorId)} declined your request`,
        href: `/dashboard/people/${actorId}`,
        at: connection.updatedAt || connection.createdAt,
      });
    }
  }

  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/**
 * Home header bell — connection requests, acceptances, and declines.
 */
export function NotificationBell() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const connections = await listConnectionsForAsync(userId);
      const actorIds = [
        ...new Set(
          connections.flatMap((c) =>
            c.requesterId === userId ? [c.recipientId] : [c.requesterId],
          ),
        ),
      ];
      const names: Record<string, string> = {};
      if (actorIds.length > 0) {
        const res = await fetch(
          `/api/people?ids=${encodeURIComponent(actorIds.join(","))}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = (await res.json()) as { people?: PublicProfileDto[] };
          for (const person of data.people || []) names[person.id] = person.name;
        }
      }
      setItems(toNotifications(userId, connections, names));
      setSeen(readSeen(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((item) => !seen.has(item.id)).length;

  function markSeen(ids: string[]) {
    if (!userId || ids.length === 0) return;
    const next = new Set(seen);
    for (const id of ids) next.add(id);
    writeSeen(userId, next);
    setSeen(next);
  }

  function onOpenItem(item: AppNotification) {
    markSeen([item.id]);
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bell}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
          <path
            d="M12 3.2a5.2 5.2 0 0 0-5.2 5.2v2.4c0 .7-.2 1.4-.6 2L4.6 15a1.2 1.2 0 0 0 1 1.9h12.8a1.2 1.2 0 0 0 1-1.9l-1.6-2.2a3.6 3.6 0 0 1-.6-2V8.4A5.2 5.2 0 0 0 12 3.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.6 17.2a2.4 2.4 0 0 0 4.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 ? (
          <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>
        ) : null}
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Notifications">
          <div className={styles.panelHead}>
            <strong>Notifications</strong>
            {unread > 0 ? (
              <button
                type="button"
                className={styles.markAll}
                onClick={() => markSeen(items.map((item) => item.id))}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          {loading && items.length === 0 ? (
            <p className={styles.empty}>Loading notifications…</p>
          ) : items.length === 0 ? (
            <p className={styles.empty}>
              Chat requests, acceptances, and declines will show up here.
            </p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => {
                const isUnread = !seen.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={isUnread ? styles.itemUnread : styles.item}
                      onClick={() => onOpenItem(item)}
                    >
                      <span className={styles.avatar} aria-hidden="true">
                        {(item.actorName[0] || "V").toUpperCase()}
                      </span>
                      <span className={styles.copy}>
                        <span className={styles.message}>{item.message}</span>
                        <span className={styles.time}>{timeAgo(item.at)}</span>
                      </span>
                      {isUnread ? <span className={styles.dot} aria-hidden="true" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
