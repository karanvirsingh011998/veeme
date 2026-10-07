"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PLAN_CATEGORIES, type PlanFilters } from "@/lib/plans/types";
import { readApproxLocation } from "@/lib/location/geo";
import {
  PlanCardSkeleton,
  SectionError,
} from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectExploreFilters,
  selectExploreLoadingMore,
  selectExploreOffset,
  selectExplorePlans,
  selectExplorePlansError,
  selectExplorePlansStatus,
  selectHasMorePlans,
  selectJoinedMap,
} from "@/store/selectors/planSelectors";
import { selectApproxLocation } from "@/store/selectors/sharedSelectors";
import {
  fetchExplorePlans,
  joinPlanOptimistic,
  setExploreFilters,
} from "@/store/slices/plansSlice";
import styles from "../social.module.css";

/**
 * Explore Plans — filters + real plan cards (empty state when none).
 */
export function ExplorePlansScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const storedLocation = useAppSelector(selectApproxLocation);
  const plans = useAppSelector(selectExplorePlans);
  const joined = useAppSelector(selectJoinedMap);
  const filters = useAppSelector(selectExploreFilters);
  const status = useAppSelector(selectExplorePlansStatus);
  const loadingMore = useAppSelector(selectExploreLoadingMore);
  const hasMore = useAppSelector(selectHasMorePlans);
  const offset = useAppSelector(selectExploreOffset);
  const loadError = useAppSelector(selectExplorePlansError);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const loading = (status === "idle" || status === "loading") && plans.length === 0;
  const error = actionError || loadError;

  useEffect(() => {
    if (!userId) return;
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(
      fetchExplorePlans({
        userId,
        location: loc,
        filters,
        offset: 0,
        append: false,
      }),
    );
  }, [dispatch, filters, storedLocation, userId]);

  function updateFilters(next: PlanFilters) {
    setActionError(null);
    dispatch(setExploreFilters(next));
  }

  async function onJoin(planId: string) {
    if (!userId) return;
    setJoiningId(planId);
    setActionError(null);
    const result = await dispatch(joinPlanOptimistic({ planId, userId }));
    setJoiningId(null);
    if (joinPlanOptimistic.rejected.match(result)) {
      setActionError(result.error.message || "Could not join.");
    }
  }

  return (
    <div className={styles.page}>
      <LocationPrompt />
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
            onClick={() => updateFilters({ ...filters, category: "all" })}
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
              onClick={() => updateFilters({ ...filters, category: c.id })}
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
                updateFilters({
                  ...filters,
                  datePreset: event.target.value as PlanFilters["datePreset"],
                })
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
                updateFilters({
                  ...filters,
                  distanceKm: event.target.value as PlanFilters["distanceKm"],
                })
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
        <SectionError
          message={error}
          onRetry={() => {
            const loc = storedLocation ?? readApproxLocation();
            void dispatch(
              fetchExplorePlans({
                userId,
                location: loc,
                filters,
                offset: 0,
                append: false,
                force: true,
              }),
            );
          }}
        />
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
            onClick={() => {
              const loc = storedLocation ?? readApproxLocation();
              void dispatch(
                fetchExplorePlans({
                  userId,
                  location: loc,
                  filters,
                  offset: offset + 20,
                  append: true,
                }),
              );
            }}
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
