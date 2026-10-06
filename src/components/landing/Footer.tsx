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
        <p className={styles.copy}>
          © {new Date().getFullYear()} Vemee · Made for getting out more.
        </p>
      </div>
    </footer>
  );
}
