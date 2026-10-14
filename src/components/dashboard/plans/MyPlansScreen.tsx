"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  formatPlanWhen,
  listUserPlansAsync,
} from "@/lib/plans/service";
import type { ActivityPlan } from "@/lib/plans/types";
import styles from "../home.module.css";

type PlanFilter = "all" | "hosting" | "joined";

/**
 * Plans you host and plans you have joined.
 */
export function MyPlansScreen() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const [filter, setFilter] = useState<PlanFilter>("all");
  const [created, setCreated] = useState<ActivityPlan[]>([]);
  const [joined, setJoined] = useState<ActivityPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    void listUserPlansAsync(userId).then((result) => {
      if (cancelled) return;
      setCreated(result.created);
      setJoined(result.joined);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const showHosting = filter === "all" || filter === "hosting";
  const showJoined = filter === "all" || filter === "joined";

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>My plans</h1>
        <p className={styles.subtitle}>Track requests, confirmations and plans you host.</p>
      </header>

      <div className={styles.segment} role="tablist" aria-label="Plan groups">
        {(
          [
            ["all", "All"],
            ["joined", "Joined"],
            ["hosting", "Hosting"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={filter === id ? styles.segmentOn : undefined}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className={styles.count}>Loading your plans…</p> : null}

      {showJoined ? (
        <section>
          <h2 className={styles.groupLabel}>Joined ({joined.length})</h2>
          {joined.length === 0 ? (
            <div className={styles.empty}>
              <h3>Nothing here yet</h3>
              <p>Explore plans and request a seat to see them here.</p>
            </div>
          ) : (
            joined.map((plan) => (
              <article key={plan.id} className={styles.request}>
                <div className={styles.titleRow}>
                  <h3>{plan.title}</h3>
                  <span className={styles.pill}>Joined</span>
                </div>
                <p>
                  {formatPlanWhen(plan.date, plan.time)} · {plan.locationLabel}
                </p>
                <div className={styles.requestActions}>
                  <Link href={`/dashboard/plans/${plan.id}`} className={styles.btnLight}>
                    View details
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {showHosting ? (
        <section>
          <h2 className={styles.groupLabel}>Hosting ({created.length})</h2>
          {created.length === 0 ? (
            <div className={styles.empty}>
              <h3>Nothing here yet</h3>
              <p>Create a plan and it will show up here.</p>
              <Link href="/dashboard/plans/new" className={`${styles.btn} ${styles.reset}`}>
                Create a plan
              </Link>
            </div>
          ) : (
            created.map((plan) => (
              <article key={plan.id} className={styles.request}>
                <div className={styles.titleRow}>
                  <h3>{plan.title}</h3>
                  <span className={styles.pill}>Hosting</span>
                </div>
                <p>
                  {formatPlanWhen(plan.date, plan.time)} · {plan.locationLabel}
                </p>
                <div className={styles.requestActions}>
                  <Link href={`/dashboard/plans/${plan.id}`} className={styles.btnLight}>
                    View details
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
