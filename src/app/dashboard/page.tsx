"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAuthSession, type AuthSession } from "@/lib/auth/session";
import { buildFullPhoneNumber } from "@/lib/phone";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    setSession(readAuthSession());
  }, []);

  const greeting =
    session?.firstName?.trim() ||
    session?.email?.split("@")[0] ||
    "there";

  const phone =
    session?.countryCode && session?.phoneNumber
      ? buildFullPhoneNumber(session.countryCode, session.phoneNumber)
      : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          Vemee
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.kicker}>Dashboard</p>
          <h1 className={styles.title}>Good to see you, {greeting}.</h1>
          <p className={styles.copy}>
            You&apos;re signed in with your mobile number. Discovery, chat, and
            bookings will live here as the product grows.
          </p>
          {phone ? (
            <p className={styles.meta}>
              Signed in as <strong>{phone}</strong>
            </p>
          ) : null}
          <Link href="/" className={styles.link}>
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}