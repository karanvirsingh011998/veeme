"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanWithMeta } from "@/lib/plans/service";
import { formatPostedAt } from "@/lib/plans/service";
import styles from "../home.module.css";

const WISHLIST_KEY = "vemee_plan_wishlist_v1";

type HomePlanCardProps = {
  plan: PlanWithMeta;
  viewerId?: string;
  saved: boolean;
  joined?: boolean;
  onSave: (planId: string) => void;
  onJoin?: (planId: string) => void;
};

export function HomePlanCard({
  plan,
  viewerId,
  saved,
  joined,
  onSave,
  onJoin,
}: HomePlanCardProps) {
  const isOwner = Boolean(viewerId && viewerId === plan.creatorId);
  const isCommunity = plan.visibility === "community";
  const capacity = Math.max(plan.peopleNeeded + 1, 1);
  const joinedCount = Math.min(plan.joinedCount, capacity);
  const pct = Math.round((joinedCount / capacity) * 100);
  const kind = isCommunity ? "Community" : "Individual";
  const place = [plan.locationLabel, plan.distanceLabel].filter(Boolean).join(" · ");

  const saveButton = (
    <button
      type="button"
      className={`${styles.iconBtn} ${saved ? styles.iconBtnSaved : ""}`}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      title={saved ? "Saved to wishlist" : "Add to wishlist"}
      onClick={() => onSave(plan.id)}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M12 20s-7-4.4-7-9.1A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.9C19 15.6 12 20 12 20Z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    </button>
  );

  const joinControl =
    isOwner || joined ? (
      <span className={`${styles.join} ${styles.joinDone}`}>
        {isOwner ? "Yours" : "Joined"}
      </span>
    ) : (
      <button type="button" className={styles.join} onClick={() => onJoin?.(plan.id)}>
        Join
      </button>
    );

  return (
    <article className={styles.card}>
      {!isCommunity ? (
        <Link href={`/dashboard/plans/${plan.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.image} alt="" className={styles.photo} />
        </Link>
      ) : null}
      <div className={styles.cardBody}>
        <div className={styles.meta}>
          <span className={styles.category}>
            {plan.categoryIcon} {plan.categoryLabel} · {kind}
          </span>
          <span className={styles.time}>{formatPostedAt(plan.createdAt)}</span>
        </div>
        <h3>
          <Link href={`/dashboard/plans/${plan.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {plan.title}
          </Link>
        </h3>
        <p className={styles.blurb}>{plan.description}</p>
        <p className={styles.place}>
          <span aria-hidden="true">📍</span>
          <span>{place}</span>
        </p>
        {isCommunity ? null : (
          <div className={styles.actions}>
            <span className={styles.spacer} />
            {saveButton}
            {joinControl}
          </div>
        )}
      </div>
      {isCommunity ? (
        <div className={styles.joinBar} style={{ ["--joined" as string]: `${pct}%` }}>
          <span className={styles.joined}>
            {joinedCount}/{capacity} joined
          </span>
          {saveButton}
          {joinControl}
        </div>
      ) : null}
    </article>
  );
}

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeWishlist(ids: string[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}
