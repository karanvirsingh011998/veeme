import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AuthShell.module.css";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

/**
 * Phone-first auth layout with a comfortable card, large controls, and brand header.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide,
}: AuthShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          Vemee
        </Link>
      </header>

      <main className={styles.main}>
        <div className={`${styles.card} ${wide ? styles.cardWide : ""}`}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}