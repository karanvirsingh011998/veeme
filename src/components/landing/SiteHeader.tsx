"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HEADER_NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import styles from "./SiteHeader.module.css";

/**
 * Public landing header — circular mark + brand + login (matches Veeme Refined).
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.mark} aria-hidden="true">
            v
          </span>
          <span className={styles.brand}>
            <span className={styles.wordmark}>Vemee</span>
            <span className={styles.tagline}>Plans are happening near you today</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {HEADER_NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.desktopActions}>
          <Button href="/login" variant="ghost" className={styles.loginBtn}>
            Log in
          </Button>
          <Button href="/signup" variant="primary" className={styles.ctaBtn}>
            Get started
          </Button>
        </div>

        <div className={styles.mobileActions}>
          <Link href="/login" className={styles.mobileLogin}>
            Log in
          </Link>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={open ? styles.burgerOpen : styles.burger}>
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        aria-hidden={!open}
      >
        <nav className={styles.mobileNav} aria-label="Mobile">
          {HEADER_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className={styles.drawerActions}>
            <Button href="/login" variant="secondary" className={styles.full}>
              Log in
            </Button>
            <Button href="/signup" variant="primary" className={styles.full}>
              Get started
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
