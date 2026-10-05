"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import styles from "../../admin-auth.module.css";
import formStyles from "@/components/admin/AdminLoginForm.module.css";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to send reset email.");
      } else {
        setMessage(
          data.message ||
            "If an account exists for that email, password reset instructions have been sent.",
        );
      }
    } catch {
      setError("Unable to send reset email right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark}>V</span>
          <span className={styles.logoText}>Vemee</span>
        </div>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>
          Enter your admin email. We&apos;ll send reset instructions if an
          account exists.
        </p>

        <form className={formStyles.form} onSubmit={onSubmit} noValidate>
          <div className={formStyles.field}>
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error ? (
            <p className={formStyles.formError} role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className={styles.success} role="status">
              {message}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className={formStyles.submit}
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className={styles.back}>
          <Link href="/admin/login">← Back to admin login</Link>
        </p>
      </main>
    </div>
  );
}