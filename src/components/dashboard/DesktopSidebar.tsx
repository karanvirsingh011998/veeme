"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { useChatUnread } from "@/components/dashboard/chat/ChatUnreadProvider";
import styles from "./DesktopSidebar.module.css";

const LINKS = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/explore", label: "Explore" },
  { href: "/dashboard/plans/new", label: "Create Plan" },
  { href: "/dashboard/people", label: "People" },
  { href: "/dashboard/chat", label: "Chat" },
  { href: "/dashboard/profile", label: "Profile" },
];

/**
 * Desktop sidebar — plans-first navigation.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { unreadChats } = useChatUnread();
  const name = profile?.first_name || user?.firstName || "Member";

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.logo}>
        Vemee
      </Link>
      <p className={styles.welcome}>Hi, {name}</p>
      <nav className={styles.nav} aria-label="Desktop">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          const showUnread =
            link.href === "/dashboard/chat" && unreadChats > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${active ? styles.active : ""}`}
            >
              <span>{link.label}</span>
              {showUnread ? (
                <span
                  className={styles.unreadDot}
                  aria-label={`${unreadChats} unread chats`}
                >
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
