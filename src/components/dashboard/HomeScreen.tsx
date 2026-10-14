"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import {
  HomePlanCard,
  readWishlist,
  writeWishlist,
} from "@/components/dashboard/home/HomePlanCard";
import { NotificationBell } from "@/components/dashboard/notifications/NotificationBell";
import {
  PlanCardSkeleton,
  SectionError,
} from "@/components/dashboard/ui/Skeletons";
import { MANUAL_CITIES, readApproxLocation } from "@/lib/location/geo";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectHomePlans,
  selectHomePlansError,
  selectHomePlansStatus,
  selectJoinedMap,
} from "@/store/selectors/planSelectors";
import { selectApproxLocation } from "@/store/selectors/sharedSelectors";
import { fetchHomePlans, joinPlanOptimistic } from "@/store/slices/plansSlice";
import { commitApproxLocation } from "@/store/slices/locationSlice";
import styles from "./home.module.css";

type HomeFilter =
  | "all"
  | "individual"
  | "group"
  | "week"
  | "weekend"
  | "near"
  | "food"
  | "fitness"
  | "outdoor";

const CHIPS: { id: Exclude<HomeFilter, "all">; label: string }[] = [
  { id: "individual", label: "Individual" },
  { id: "group", label: "Group" },
  { id: "week", label: "This week" },
  { id: "weekend", label: "Weekend" },
  { id: "near", label: "Near me" },
  { id: "food", label: "Coffee" },
  { id: "fitness", label: "Fitness" },
  { id: "outdoor", label: "Outdoor" },
];

/**
 * Discover feed — search, activity chips, and plan cards.
 */
export function HomeScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const initial = (
    profile?.first_name?.trim() ||
    user?.firstName?.trim() ||
    "V"
  )[0]!.toUpperCase();
  const storedLocation = useAppSelector(selectApproxLocation);
  const nearbyPlans = useAppSelector(selectHomePlans);
  const joined = useAppSelector(selectJoinedMap);
  const plansStatus = useAppSelector(selectHomePlansStatus);
  const plansError = useAppSelector(selectHomePlansError);
  const plansLoading = plansStatus === "idle" || plansStatus === "loading";
  const [filter, setFilter] = useState<HomeFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [areaOpen, setAreaOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readWishlist());
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchHomePlans({ userId, location: loc }));
  }, [dispatch, storedLocation, userId]);

  function retry() {
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchHomePlans({ userId, location: loc, force: true }));
  }

  function toggleSaved(planId: string) {
    setSavedIds((current) => {
      const next = current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId];
      writeWishlist(next);
      return next;
    });
  }

  const areaLabel =
    storedLocation?.area || storedLocation?.city || "Explore nearby";

  const plans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return nearbyPlans.filter((plan) => {
      if (filter === "individual" && plan.visibility === "community") return false;
      if (filter === "group" && plan.visibility !== "community") return false;
      if (filter === "food" && plan.category !== "food") return false;
      if (filter === "fitness" && plan.category !== "fitness") return false;
      if (filter === "outdoor" && plan.category !== "outdoor") return false;
      if (filter === "week" || filter === "weekend") {
        const when = new Date(`${plan.date}T12:00:00`);
        if (Number.isNaN(when.getTime())) return false;
        if (filter === "week") {
          const ahead = when.getTime() - Date.now();
          if (ahead > 7 * 864e5 || ahead < -864e5) return false;
        } else {
          const day = when.getDay();
          if (day !== 0 && day !== 6) return false;
        }
      }
      if (filter === "near" && plan.distanceLabel) {
        const km = Number.parseFloat(plan.distanceLabel);
        if (!Number.isNaN(km) && km > 20) return false;
      }
      if (!needle) return true;
      const hay = `${plan.title} ${plan.description} ${plan.categoryLabel} ${plan.locationLabel}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [filter, nearbyPlans, query]);

  const activeChip = CHIPS.find((chip) => chip.id === filter);
  const heading = query.trim()
    ? "Matching plans"
    : filter === "all"
      ? "Plans worth joining"
      : `${activeChip?.label || "Filtered"} plans`;

  return (
    <div className={styles.page}>
      <LocationPrompt />
      <header className={styles.top}>
        <div>
          <div className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true">
              <LeafIcon />
            </span>
            vemee<b>.</b>
          </div>
          <p className={styles.subtitle}>Good plans. Better company.</p>
        </div>
        <div className={styles.actions}>
          <NotificationBell />
          <Link href="/dashboard/profile" className={styles.profileBtn} aria-label="Open profile">
            {initial}
          </Link>
        </div>
      </header>

      <div className={styles.intro}>
        <p className={styles.eyebrow}>Explore activities</p>
        <h1 className={styles.title}>
          Find your people,
          <br />
          one plan at a time.
        </h1>
      </div>

      <button
        type="button"
        className={styles.locationBtn}
        aria-label="Choose your area"
        onClick={() => setAreaOpen(true)}
      >
        <PinIcon />
        {areaLabel}
        <ChevronIcon />
      </button>

      <label className={styles.search}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search plans"
          placeholder="Try coffee, badminton, art..."
          autoComplete="off"
        />
        {query ? (
          <button type="button" className={styles.clear} onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </label>

      <div className={styles.chips} aria-label="Activity filters">
        <button
          type="button"
          className={`${styles.chip} ${filtersOpen || filter !== "all" ? styles.chipOn : ""}`}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersIcon />
          Filter{activeChip ? ` · ${activeChip.label}` : ""}
        </button>
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={filter === chip.id ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            onClick={() => {
              setFilter((current) => (current === chip.id ? "all" : chip.id));
              setFiltersOpen(false);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtersOpen ? (
        <div className={styles.filterPanel}>
          <button
            type="button"
            className={filter === "all" ? styles.filterOptionOn : styles.filterOption}
            onClick={() => {
              setFilter("all");
              setFiltersOpen(false);
            }}
          >
            All plans
          </button>
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={filter === chip.id ? styles.filterOptionOn : styles.filterOption}
              onClick={() => {
                setFilter(chip.id);
                setFiltersOpen(false);
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.section}>
        <div>
          <h2>{heading}</h2>
          <p className={styles.count}>
            {plans.length === 1 ? "1 activity" : `${plans.length} activities`}
            {storedLocation?.city ? ` · ${storedLocation.city}` : ""}
          </p>
        </div>
        <Link href="/dashboard/people" className={styles.textBtn}>
          Meet people
          <ChevronRightIcon />
        </Link>
      </div>

      {plansLoading && nearbyPlans.length === 0 ? (
        <PlanCardSkeleton count={2} />
      ) : plansError && nearbyPlans.length === 0 ? (
        <SectionError message={plansError} onRetry={retry} />
      ) : plans.length === 0 ? (
        <div className={styles.empty}>
          <h3>No plans match just yet</h3>
          <p>Try another activity, location or time filter.</p>
          <button
            type="button"
            className={`${styles.btnLight} ${styles.reset}`}
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className={styles.cards}>
          {plans.map((plan) => (
            <HomePlanCard
              key={plan.id}
              plan={plan}
              viewerId={userId}
              saved={savedIds.includes(plan.id)}
              joined={joined[plan.id]}
              onSave={toggleSaved}
              onJoin={(id) => {
                if (!userId) return;
                void dispatch(joinPlanOptimistic({ planId: id, userId }));
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.section}>
        <h2>Also explore</h2>
      </div>
      <div className={styles.exploreRow}>
        <Link href="/dashboard/people" className={styles.btnLight}>
          People
        </Link>
        <Link href="/dashboard/moments" className={styles.btnLight}>
          Moments
        </Link>
      </div>

      {areaOpen ? (
        <div className={styles.sheetBackdrop} onClick={() => setAreaOpen(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHead}>
              <h2 id="area-title">Choose your area</h2>
              <button type="button" className={styles.profileBtn} onClick={() => setAreaOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className={styles.cityList}>
              {MANUAL_CITIES.map((city) => (
                <button
                  key={`${city.city}-${city.area}`}
                  type="button"
                  onClick={() => {
                    dispatch(
                      commitApproxLocation({
                        lat: city.lat,
                        lng: city.lng,
                        city: city.city,
                        area: city.area,
                        source: "manual",
                        updatedAt: new Date().toISOString(),
                      }),
                    );
                    setAreaOpen(false);
                  }}
                >
                  {city.city}
                  <span>{city.area}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LeafIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 4c-9 0-15 3-15 10a6 6 0 0 0 6 6c7 0 10-6 9-16z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 21c2-6 6-9 12-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="2" fill="currentColor" />
      <circle cx="10" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}
