import Link from "next/link";
import styles from "./Footer.module.css";

/**
 * Minimal marketing footer matching Veeme Refined.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            v
          </span>
          Vemee
        </Link>
        <nav className={styles.links} aria-label="Legal">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Vemee · Made for getting out more.
        </p>
      </div>
    </footer>
  );
}
