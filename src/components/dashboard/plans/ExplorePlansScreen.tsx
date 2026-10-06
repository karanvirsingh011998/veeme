"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PLAN_CATEGORIES, type PlanFilters } from "@/lib/plans/types";
import {
  getParticipantAsync,
  joinPlan,
  listPlans,
  type PlanWithMeta,
} from "@/lib/plans/service";
import { buildCreatorMapAsync } from "@/lib/people/service";
import {
  readApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
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
  const filterKeyRef = useRef("");

  const refresh = useCallback(async () => {
    const nextKey = JSON.stringify({ filters, location: location?.city, userId });
    const filtersChanged = filterKeyRef.current !== nextKey;
    if (filtersChanged || !filterKeyRef.current) setLoading(true);
    try {
      const loc = location || readApproxLocation();
      const raw = await listPlans(filters, { userLocation: loc });
      const creators = await buildCreatorMapAsync(raw.map((p) => p.creatorId));
      const withCreators = await listPlans(filters, {
        userLocation: loc,
        creators,
      });
      setPlans(withCreators);
      const map: Record<string, boolean> = {};
      if (userId) {
        await Promise.all(
          withCreators.map(async (p) => {
            const part = await getParticipantAsync(p.id, userId);
            map[p.id] = part?.status === "joined";
          }),
        );
      }
      setJoined(map);
      filterKeyRef.current = nextKey;
    } finally {
      setLoading(false);
    }
  }, [filters, location, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onJoin(planId: string) {
    if (!userId) return;
    setJoiningId(planId);
    const result = await joinPlan(planId, userId);
    setJoiningId(null);
    if (result.ok) {
      setJoined((prev) => ({ ...prev, [planId]: true }));
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

      <div className={styles.filters} aria-label="Activity filters">
        <button
          type="button"
          className={`${styles.filter} ${filters.category === "all" ? styles.filterActive : ""}`}
          onClick={() => setFilters((f) => ({ ...f, category: "all" }))}
        >
          All
        </button>
        {PLAN_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.filter} ${filters.category === c.id ? styles.filterActive : ""}`}
            onClick={() => setFilters((f) => ({ ...f, category: c.id }))}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.filters} aria-label="Date filters">
        {(
          [
            ["all", "Any day"],
            ["today", "Today"],
            ["tomorrow", "Tomorrow"],
            ["weekend", "This weekend"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.filter} ${filters.datePreset === id ? styles.filterActive : ""}`}
            onClick={() => setFilters((f) => ({ ...f, datePreset: id }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.filters} aria-label="Distance filters">
        {(
          [
            ["all", "Any distance"],
            ["nearby", "Nearby"],
            ["5", "Within 5 km"],
            ["10", "Within 10 km"],
            ["25", "Within 25 km"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.filter} ${filters.distanceKm === id ? styles.filterActive : ""}`}
            onClick={() => setFilters((f) => ({ ...f, distanceKm: id }))}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <ScreenLoading message="Loading plans…" />
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
    </div>
  );
}
