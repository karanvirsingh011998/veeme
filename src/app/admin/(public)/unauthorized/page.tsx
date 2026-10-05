import Link from "next/link";
import styles from "../../admin-auth.module.css";

export const metadata = {
  title: "Access denied — Vemee Admin",
};

export default function AdminUnauthorizedPage() {
  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark}>V</span>
          <span className={styles.logoText}>Vemee</span>
        </div>
        <h1 className={styles.title}>Access denied</h1>
        <p className={styles.subtitle}>
          You don&apos;t have permission to view the admin dashboard. If you
          believe this is a mistake, contact a Vemee administrator.
        </p>
        <p className={styles.back}>
          <Link href="/dashboard">Go to app</Link>
          {" · "}
          <Link href="/admin/login">Admin login</Link>
        </p>
      </main>
    </div>
  );
}