"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectNotificationError,
  selectNotificationStatus,
  selectNotifications,
  selectSeenNotificationIds,
  selectUnreadNotificationCount,
} from "@/store/selectors/sharedSelectors";
import { selectCurrentUserId } from "@/store/selectors/userSelectors";
import {
  fetchNotifications,
  notificationsSeen,
  type AppNotification,
} from "@/store/slices/notificationSlice";
import styles from "./NotificationBell.module.css";

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Home header bell. Notification data lives in Redux and is loaded once
 * for the whole dashboard.
 */
export function NotificationBell() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectCurrentUserId);
  const items = useAppSelector(selectNotifications);
  const seenIds = useAppSelector(selectSeenNotificationIds);
  const unread = useAppSelector(selectUnreadNotificationCount);
  const status = useAppSelector(selectNotificationStatus);
  const error = useAppSelector(selectNotificationError);
  const seen = useMemo(() => new Set(seenIds), [seenIds]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const loading = status === "loading" && items.length === 0;

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

  function markSeen(ids: string[]) {
    dispatch(notificationsSeen(ids));
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
          if (userId) void dispatch(fetchNotifications({ userId, force: true }));
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
          {loading ? (
            <p className={styles.empty}>Loading notifications…</p>
          ) : error && items.length === 0 ? (
            <p className={styles.empty}>{error}</p>
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
