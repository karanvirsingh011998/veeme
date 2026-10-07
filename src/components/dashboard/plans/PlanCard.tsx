"use client";

import { memo } from "react";
import Link from "next/link";
import type { PlanWithMeta } from "@/lib/plans/service";
import { formatPlanWhen, formatPostedAt } from "@/lib/plans/service";
import styles from "../social.module.css";

type PlanCardProps = {
  plan: PlanWithMeta;
  viewerId?: string;
  onJoin?: (planId: string) => void;
  joining?: boolean;
  joined?: boolean;
};

/**
 * Reusable explore/home plan card with creator + schedule.
 */
export const PlanCard = memo(function PlanCard({
  plan,
  viewerId,
  onJoin,
  joining,
  joined,
}: PlanCardProps) {
  const isOwner = Boolean(viewerId && viewerId === plan.creatorId);
  const creatorLabel = plan.creatorName || "Plan creator";

  return (
    <article className={styles.planCard}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={plan.image}
        alt=""
        className={styles.planImage}
        loading="lazy"
        decoding="async"
      />
      <div className={styles.planBody}>
        <div className={styles.cardTop}>
          <span className={styles.category}>
            {plan.categoryIcon} {plan.categoryLabel}
          </span>
          <span className={styles.postedAt}>
            {formatPostedAt(plan.createdAt)}
          </span>
        </div>

        <h3 className={styles.planTitle}>{plan.title}</h3>
        <p className={styles.planDesc}>{plan.description}</p>

        <div className={styles.metaRow}>
          <span>🗓 {formatPlanWhen(plan.date, plan.time)}</span>
          <span>📍 {plan.locationLabel}</span>
          {plan.distanceLabel ? <span>{plan.distanceLabel}</span> : null}
        </div>

        <div className={styles.metaRow}>
          <span>
            {plan.joinedCount} of {plan.peopleNeeded + 1} people joined
          </span>
        </div>

        <div className={styles.creatorRow}>
          <span className={styles.avatar} aria-hidden="true">
            {(creatorLabel[0] || "V").toUpperCase()}
          </span>
          <div className={styles.creatorMeta}>
            <span className={styles.creatorLabel}>
              {isOwner ? "Created by you" : `Created by ${creatorLabel}`}
            </span>
            <span className={styles.creatorTime}>
              {formatPlanWhen(plan.date, plan.time)}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link
            href={`/dashboard/plans/${plan.id}`}
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            View Plan
          </Link>
          {isOwner ? (
            <span className={`${styles.btn} ${styles.btnGhost}`}>Your plan</span>
          ) : joined ? (
            <span className={`${styles.btn} ${styles.btnGhost}`}>Joined ✓</span>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onJoin?.(plan.id)}
              disabled={joining}
            >
              {joining ? "Joining…" : "Join Plan"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
