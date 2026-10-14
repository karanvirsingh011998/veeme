"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import styles from "./DesktopSidebar.module.css";

const LINKS = [
  { href: "/dashboard", label: "Discover", exact: true },
  { href: "/dashboard/plans", label: "My plans", exact: true },
  { href: "/dashboard/plans/new", label: "Create" },
  { href: "/dashboard/people", label: "People" },
  { href: "/dashboard/chat", label: "Chats" },
  { href: "/dashboard/moments", label: "Moments" },
  { href: "/dashboard/profile", label: "Profile" },
];

/**
 * Desktop sidebar — same destinations as the mobile tab bar, plus Moments and Profile.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { unreadChats } = useChatUnread();

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.wordmark} aria-label="Vemee home">
        <span className={styles.mark} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 4c-9 0-15 3-15 10a6 6 0 0 0 6 6c7 0 10-6 9-16z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4 21c2-6 6-9 12-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        vemee<b>.</b>
      </Link>
      <p className={styles.tagline}>Good plans. Better company.</p>
      <nav className={styles.nav} aria-label="Desktop">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          const showUnread = link.href === "/dashboard/chat" && unreadChats > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${active ? styles.active : ""}`}
            >
              <span>{link.label}</span>
              {showUnread ? (
                <span className={styles.unreadDot} aria-label={`${unreadChats} unread chats`}>
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
