import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import styles from "./Footer.module.css";

/**
 * Public marketing footer with light product links.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            Vemee
          </Link>
          <p>Find your people. Make better plans.</p>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <Link href="/login">Log in</Link>
          <Link href="/signup">Get started</Link>
        </nav>
      </div>
      <div className={`container ${styles.legal}`}>
        <p>© {new Date().getFullYear()} Vemee. Built for real-world connections.</p>
      </div>
    </footer>
  );
}