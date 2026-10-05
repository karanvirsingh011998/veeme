import { Suspense } from "react";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import styles from "../../admin-auth.module.css";

export const metadata = {
  title: "Admin Login — Vemee",
};

export default function AdminLoginPage() {
  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark}>V</span>
          <span className={styles.logoText}>Vemee</span>
        </div>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.subtitle}>Sign in to admin dashboard</p>
        <Suspense fallback={<p className={styles.subtitle}>Loading…</p>}>
          <AdminLoginForm />
        </Suspense>
        <p className={styles.back}>
          <Link href="/">← Back to Vemee</Link>
        </p>
      </main>
    </div>
  );
}