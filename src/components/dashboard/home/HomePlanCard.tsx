"use client";

import Link from "next/link";
import type { PlanWithMeta } from "@/lib/plans/service";
import { formatPlanWhen } from "@/lib/plans/service";
import type { PlanCategoryId } from "@/lib/plans/types";
import styles from "../home.module.css";

const WISHLIST_KEY = "vemee_plan_wishlist_v1";

const HERO: Record<PlanCategoryId, [string, string]> = {
  travel: ["#f6d7c4", "#e7a888"],
  fitness: ["#f4cdb8", "#d77d5c"],
  outdoor: ["#e8d7b0", "#c9a36a"],
  gaming: ["#ead4ef", "#c49ad4"],
  movies: ["#f3d0c4", "#e08b78"],
  food: ["#f6d3b4", "#e39a62"],
  study: ["#e4d8c8", "#c4b09a"],
  events: ["#f2c9b8", "#d98a6e"],
  other: ["#f4dbcf", "#e9bda7"],
};

type HomePlanCardProps = {
  plan: PlanWithMeta;
  viewerId?: string;
  saved?: boolean;
  joined?: boolean;
  joining?: boolean;
  hideSave?: boolean;
  onSave?: (planId: string) => void;
  onJoin?: (planId: string) => void;
};

export function HomePlanCard({
  plan,
  viewerId,
  saved = false,
  joined,
  joining,
  hideSave,
  onSave,
  onJoin,
}: HomePlanCardProps) {
  const isOwner = Boolean(viewerId && viewerId === plan.creatorId);
  const isCommunity = plan.visibility === "community";
  const capacity = Math.max(plan.peopleNeeded + 1, 1);
  const joinedCount = Math.min(plan.joinedCount, capacity);
  const pct = Math.round((joinedCount / capacity) * 100);
  const [from, to] = HERO[plan.category] || HERO.other;
  const host = isOwner ? "You" : plan.creatorName || "Host";
  const initials = host
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const place = [plan.locationLabel, plan.distanceLabel].filter(Boolean).join(" · ");
  const full = plan.spotsLeft <= 0 && !joined && !isOwner;
  const kind = isCommunity ? "COMMUNITY" : "INDIVIDUAL PLAN";

  return (
    <article className={styles.card}>
      <div className={styles.hero} style={{ ["--a" as string]: from, ["--b" as string]: to }}>
        <span className={styles.emoji} aria-hidden="true">
          {plan.categoryIcon}
        </span>
        <span className={styles.heroLabel}>
          {plan.categoryLabel.toUpperCase()} · {kind}
        </span>
        {hideSave ? null : (
          <button
            type="button"
            className={`${styles.save} ${saved ? styles.saveOn : ""}`}
            aria-label={saved ? "Remove from saved plans" : "Save plan"}
            onClick={() => onSave?.(plan.id)}
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
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.planTitle}>
            <Link href={`/dashboard/plans/${plan.id}`}>{plan.title}</Link>
          </h3>
          {joined && !isOwner ? <span className={styles.pill}>Confirmed</span> : null}
        </div>
        <p className={styles.desc}>{plan.description}</p>
        <div className={styles.metaGrid}>
          <div className={styles.meta}>
            <CalendarIcon />
            <span>{formatPlanWhen(plan.date, plan.time)}</span>
          </div>
          <div className={styles.meta}>
            <WalletIcon />
            <span>Free</span>
          </div>
          <div className={`${styles.meta} ${styles.metaWide}`}>
            <PinIcon />
            <span>{place}</span>
          </div>
        </div>
        {isCommunity || plan.peopleNeeded > 1 ? (
          <div className={styles.capacity}>
            <strong>
              {joinedCount}/{capacity} joined
            </strong>
            <span className={styles.track} aria-hidden="true">
              <i style={{ width: `${pct}%` }} />
            </span>
            <span>{plan.spotsLeft} spots</span>
          </div>
        ) : (
          <p className={styles.note}>One-to-one meetup · Connect directly with the host</p>
        )}
      </div>
      <div className={styles.footer}>
        <div className={styles.host}>
          <span className={styles.avatar}>
            {plan.creatorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={plan.creatorAvatar} alt="" />
            ) : (
              initials || "V"
            )}
          </span>
          <span className={styles.hostName}>{host}</span>
        </div>
        <Link href={`/dashboard/plans/${plan.id}`} className={styles.btnLight}>
          Details
        </Link>
        {isOwner ? (
          <Link href={`/dashboard/plans/${plan.id}`} className={styles.btn}>
            Manage
          </Link>
        ) : joined ? (
          <Link href={`/dashboard/plans/${plan.id}`} className={styles.btnGreen}>
            Confirmed
          </Link>
        ) : (
          <button
            type="button"
            className={styles.btn}
            disabled={full || joining}
            onClick={() => onJoin?.(plan.id)}
          >
            {joining ? "Requesting…" : full ? "Full" : "Request"}
          </button>
        )}
      </div>
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

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 3v4M17 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18M7 3h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
