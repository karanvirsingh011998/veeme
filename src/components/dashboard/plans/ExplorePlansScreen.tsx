"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PLAN_CATEGORIES, type PlanFilters } from "@/lib/plans/types";
import {
  joinPlan,
  listPlansPage,
  type PlanWithMeta,
} from "@/lib/plans/service";
import { buildCreatorMapAsync } from "@/lib/people/service";
import {
  readApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import {
  PlanCardSkeleton,
  SectionError,
} from "@/components/dashboard/ui/Skeletons";
import styles from "../social.module.css";

/**
 * Explore Plans — filters + real plan cards (empty state when none).
 */
export function ExplorePlansScreen() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const [location, setLocation] = useState<ApproxLocation | null>(null);
  const [plans, setPlans] = useState<PlanWithMeta[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlanFilters>({
    category: "all",
    datePreset: "all",
    distanceKm: "all",
    availability: "all",
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const filterKeyRef = useRef("");

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      const nextKey = JSON.stringify({
        filters,
        location: location?.city,
        userId,
      });
      const filtersChanged = filterKeyRef.current !== nextKey;
      if (!append && filtersChanged && filterKeyRef.current) {
        setPlans([]);
        setLoading(true);
      } else if (!append && !filterKeyRef.current) {
        setLoading(true);
      }
      if (append) setLoadingMore(true);
      try {
        const loc = location || readApproxLocation();
        const page = await listPlansPage(filters, {
          userLocation: loc,
          viewerId: userId,
          limit: 20,
          offset,
        });
        const creators = await buildCreatorMapAsync(
          page.plans.map((plan) => plan.creatorId),
        );
        const named = page.plans.map((plan) => {
          const creator = creators.get(plan.creatorId);
          return creator
            ? { ...plan, creatorName: creator.name, creatorAvatar: creator.avatar }
            : plan;
        });
        setPlans((current) => (append ? [...current, ...named] : named));
        setJoined((current) => {
          const next = append ? { ...current } : {};
          for (const plan of named) next[plan.id] = Boolean(plan.viewerJoined);
          return next;
        });
        setHasMore(page.hasMore);
        pageRef.current = offset;
        filterKeyRef.current = nextKey;
        setError(null);
      } catch {
        setError("Couldn't load plans.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, location, userId],
  );

  const refresh = useCallback(async () => {
    pageRef.current = 0;
    await loadPage(0, false);
  }, [loadPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onJoin(planId: string) {
    if (!userId) return;
    setJoiningId(planId);
    setJoined((prev) => ({ ...prev, [planId]: true }));
    const result = await joinPlan(planId, userId);
    setJoiningId(null);
    if (!result.ok) {
      setJoined((prev) => ({ ...prev, [planId]: false }));
      setError(result.error);
    }
  }

  return (
    <div className={styles.page}>
      <LocationPrompt onResolved={setLocation} />
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Explore Plans</h1>
          <p className={styles.sub}>
            Discover plans nearby and join what you want to do.
          </p>
        </div>
        <Link
          href="/dashboard/plans/new"
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          Create
        </Link>
      </div>

      <section className={styles.filterPanel} aria-label="Plan filters">
        <div className={styles.categoryRow} role="tablist" aria-label="Activity">
          <button
            type="button"
            role="tab"
            aria-selected={filters.category === "all"}
            className={`${styles.filterChip} ${filters.category === "all" ? styles.filterChipActive : ""}`}
            onClick={() => setFilters((f) => ({ ...f, category: "all" }))}
          >
            All
          </button>
          {PLAN_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filters.category === c.id}
              className={`${styles.filterChip} ${filters.category === c.id ? styles.filterChipActive : ""}`}
              onClick={() => setFilters((f) => ({ ...f, category: c.id }))}
            >
              <span aria-hidden="true">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className={styles.filterControls}>
          <label className={styles.filterField}>
            <span>When</span>
            <select
              className={styles.filterSelect}
              value={filters.datePreset}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  datePreset: event.target.value as PlanFilters["datePreset"],
                }))
              }
            >
              <option value="all">Any day</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="weekend">This weekend</option>
            </select>
          </label>
          <label className={styles.filterField}>
            <span>Distance</span>
            <select
              className={styles.filterSelect}
              value={filters.distanceKm}
              onChange={(event) =>
                setFilters((f) => ({
                  ...f,
                  distanceKm: event.target.value as PlanFilters["distanceKm"],
                }))
              }
            >
              <option value="all">Any distance</option>
              <option value="nearby">Nearby</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
            </select>
          </label>
        </div>
      </section>

      {loading && plans.length === 0 ? (
        <PlanCardSkeleton count={3} />
      ) : error && plans.length === 0 ? (
        <SectionError message={error} onRetry={() => void refresh()} />
      ) : plans.length === 0 ? (
        <div className={styles.empty}>
          <h3>No plans nearby</h3>
          <p>
            There aren&apos;t many plans around you yet. Be the first to create
            one.
          </p>
          <div className={styles.emptyActions}>
            <Link
              href="/dashboard/plans/new"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Create a Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              viewerId={userId}
              joined={joined[plan.id]}
              joining={joiningId === plan.id}
              onJoin={(id) => void onJoin(id)}
            />
          ))}
        </div>
      )}
      {hasMore && plans.length > 0 ? (
        <div className={styles.emptyActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            disabled={loadingMore}
            onClick={() => void loadPage(pageRef.current + 20, true)}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
      {error && plans.length > 0 ? (
        <p className={styles.error}>{error}</p>
      ) : null}
    </div>
  );
}
