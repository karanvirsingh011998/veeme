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
        Signed in as <strong>{session?.email}</strong>. Manage Vemee members,
        moderation, and platform health from here.
      </p>

      <div className={styles.grid}>
        <Link href="/admin/users" className={styles.card}>
          <h2>Users</h2>
          <p>Browse profiles, verification status, and account details.</p>
        </Link>
        <div className={styles.cardMuted}>
          <h2>Moderation</h2>
          <p>Reports and safety tools — coming next.</p>
        </div>
        <div className={styles.cardMuted}>
          <h2>Bookings</h2>
          <p>Marketplace booking oversight — coming next.</p>
        </div>
      </div>
    </div>
  );
}