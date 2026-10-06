import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./LegalShell.module.css";

type LegalShellProps = {
  title: string;
  updated: string;
  children: ReactNode;
};

/**
 * Simple legal document layout for Terms and Privacy.
 */
export function LegalShell({ title, updated, children }: LegalShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          Vemee
        </Link>
      </header>
      <main className={styles.main}>
        <article className={styles.article}>
          <p className={styles.eyebrow}>Legal</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Last updated {updated}</p>
          <div className={styles.body}>{children}</div>
          <p className={styles.back}>
            <Link href="/signup">← Back to signup</Link>
          </p>
        </article>
      </main>
    </div>
  );
}
