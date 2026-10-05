"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import styles from "./DesktopSidebar.module.css";

const LINKS = [
  { href: "/dashboard", label: "Home", exact: true },
  { href: "/dashboard/discover", label: "Discover" },
  { href: "/dashboard/community", label: "Community" },
  { href: "/dashboard/chat", label: "Chat" },
  { href: "/dashboard/profile", label: "Profile" },
];

/**
 * Desktop sidebar navigation — intentional desktop hierarchy, not a stretched mobile nav.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const name =
    profile?.first_name ||
    user?.firstName ||
    "Member";

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
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${active ? styles.active : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}