"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import styles from "./BottomNav.module.css";

const TABS = [
  {
    href: "/dashboard",
    label: "Discover",
    match: (path: string) => path === "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/plans",
    label: "My plans",
    match: (path: string) => path === "/dashboard/plans",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/dashboard/plans/new",
    label: "Create",
    match: (path: string) => path.startsWith("/dashboard/plans/new"),
    create: true,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/people",
    label: "People",
    match: (path: string) => path.startsWith("/dashboard/people"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
        <path d="M17 5a3 3 0 0 1 0 6M22 20v-2a5 5 0 0 0-4-5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/chat",
    label: "Chats",
    match: (path: string) => path.startsWith("/dashboard/chat"),
    badge: "chat" as const,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-5.5a8.5 8.5 0 1 1 16.2-4z" />
      </svg>
    ),
  },
] as const;

/**
 * Mobile bottom navigation — Discover, My plans, Create, People, Chats.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { unreadChats } = useChatUnread();

  return (
    <nav className={styles.bottom} aria-label="Main navigation">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const showChatBadge =
          "badge" in tab && tab.badge === "chat" && unreadChats > 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.nav} ${active ? styles.active : ""} ${"create" in tab && tab.create ? styles.create : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={
              showChatBadge
                ? `Chats, ${unreadChats} unread ${unreadChats === 1 ? "chat" : "chats"}`
                : tab.label
            }
          >
            {"create" in tab && tab.create ? (
              <span className={styles.orb}>{tab.icon}</span>
            ) : (
              <span className={styles.navIcon}>
                {tab.icon}
                {showChatBadge ? (
                  <span className={styles.badge} aria-hidden="true">
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </span>
                ) : null}
              </span>
            )}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
