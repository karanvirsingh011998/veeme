"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminShell.module.css";

const NAV = [
  { href: "/admin", label: "Overview", exact: true as const },
  { href: "/admin/users", label: "Users", exact: false as const },
] as const;

type AdminShellProps = {
  email: string;
  children: React.ReactNode;
};

/**
 * Admin chrome with sidebar + logout. Role is already verified server-side.
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
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""}`}
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
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}