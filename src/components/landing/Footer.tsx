import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/constants";
import { Logo } from "@/components/ui/Logo";
import styles from "./Footer.module.css";

/**
 * Public site footer — plans, membership, about, and legal.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Vemee">
          <Logo height={72} />
        </Link>
        <nav className={styles.links} aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className={styles.copy}>
          © {new Date().getFullYear()} Vemee · Made for getting out more.
        </p>
      </div>
    </footer>
  );
}
