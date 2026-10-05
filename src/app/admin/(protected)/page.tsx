import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import styles from "./admin-home.module.css";

export const metadata = {
  title: "Admin — Vemee",
};

export default async function AdminHomePage() {
  const session = await getAdminSession();

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Overview</p>
      <h1 className={styles.title}>Admin dashboard</h1>
      <p className={styles.copy}>
        Signed in as <strong>{session?.email}</strong>. Jump into profiles,
        revenue, or chats.
      </p>

      <div className={styles.grid}>
        <Link href="/admin/profiles" className={styles.card}>
          <h2>Profiles</h2>
          <p>Full member profiles, verification, and account details.</p>
        </Link>
        <Link href="/admin/revenue" className={styles.card}>
          <h2>Revenue</h2>
          <p>Payment totals, pending amounts, and transaction history.</p>
        </Link>
        <Link href="/admin/chats" className={styles.card}>
          <h2>Chats</h2>
          <p>Browse conversations and open full message threads.</p>
        </Link>
      </div>
    </div>
  );
}
