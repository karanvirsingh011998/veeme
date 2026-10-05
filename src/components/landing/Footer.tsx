import Link from "next/link";
import { FOOTER_LEGAL, NAV_LINKS } from "@/lib/constants";
import styles from "./Footer.module.css";

/**
 * Public marketing footer with product nav and legal links.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            Vemee
          </Link>
          <p>Find your people. Do more together.</p>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <nav className={styles.legalNav} aria-label="Legal">
          {FOOTER_LEGAL.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className={`container ${styles.legal}`}>
        <p>© {new Date().getFullYear()} Vemee. Plans, not profiles.</p>
      </div>
    </footer>
  );
}
