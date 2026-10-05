"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/admin", label: "Overview", exact: true as const },
  { href: "/admin/profiles", label: "Profiles", exact: false as const },
  { href: "/admin/revenue", label: "Revenue", exact: false as const },
  { href: "/admin/chats", label: "Chats", exact: false as const },
] as const;

type AdminShellProps = {
  email: string;
  children: React.ReactNode;
};

/**
 * Admin chrome with sidebar tabs + mobile tab strip. Role verified server-side.
 */
export function AdminShell({ email, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    if (href === "/admin/profiles") {
      return (
        pathname.startsWith("/admin/profiles") ||
        pathname.startsWith("/admin/users")
      );
    }
    return pathname.startsWith(href);
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/admin" className={styles.brand}>
          <span className={styles.logoMark}>V</span>
          <span>
            <strong>Vemee</strong>
            <small>Admin</small>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Admin">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <p className={styles.email}>{email}</p>
          <button
            type="button"
            className={styles.logout}
            onClick={() => void logout()}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <Link href="/admin" className={styles.mobileBrand}>
            Vemee Admin
          </Link>
          <button
            type="button"
            className={styles.mobileLogout}
            onClick={() => void logout()}
            disabled={loggingOut}
          >
            Log out
          </button>
        </header>

        <nav className={styles.mobileTabs} aria-label="Admin sections">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileTab} ${active ? styles.mobileTabActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
