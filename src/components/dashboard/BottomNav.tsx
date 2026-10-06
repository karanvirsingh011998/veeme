"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import styles from "./BottomNav.module.css";

const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    match: (path: string) => path === "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.5 10.5 12 3.8l8.5 6.7v9.2a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19.7z" />
        <path d="M9 21v-6.2h6V21" />
      </svg>
    ),
  },
  {
    href: "/dashboard/explore",
    label: "Explore",
    match: (path: string) =>
      path.startsWith("/dashboard/explore") ||
      path.startsWith("/dashboard/discover") ||
      (path.startsWith("/dashboard/plans/") && !path.includes("/new")),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.2" />
        <path d="m16 16 4.4 4.4" />
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
        <circle cx="12" cy="7.5" r="3.2" />
        <circle cx="5.8" cy="12.5" r="2.4" />
        <circle cx="18.2" cy="12.5" r="2.4" />
        <path d="M6 20c.3-3 2.1-5 6-5s5.7 2 6 5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/chat",
    label: "Chat",
    match: (path: string) => path.startsWith("/dashboard/chat"),
    badge: "chat" as const,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5h14a2 2 0 0 1 2 2v8.2a2 2 0 0 1-2 2H11l-4.7 3v-3H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    match: (path: string) => path.startsWith("/dashboard/profile"),
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7.2" r="3.2" />
        <path d="M5.2 20c.4-4.1 2.6-6.2 6.8-6.2s6.4 2.1 6.8 6.2" />
      </svg>
    ),
  },
] as const;

/**
 * Mobile bottom navigation — Home, Explore, Create, People, Chat, Profile.
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
                ? `Chat, ${unreadChats} unread ${unreadChats === 1 ? "chat" : "chats"}`
                : tab.label
            }
          >
            <span className={styles.navIcon}>
              {tab.icon}
              {showChatBadge ? (
                <span className={styles.badge} aria-hidden="true">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              ) : null}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
