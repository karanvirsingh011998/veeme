"use client";

import { useEffect, useRef, useState } from "react";
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
import { readApproxLocation } from "@/lib/location/geo";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectHomePlans,
  selectHomePlansError,
  selectHomePlansStatus,
  selectJoinedMap,
} from "@/store/selectors/planSelectors";
import {
  selectApproxLocation,
  selectPeople,
} from "@/store/selectors/sharedSelectors";
import { fetchHomePlans, joinPlanOptimistic } from "@/store/slices/plansSlice";
import { fetchPeopleCards } from "@/store/slices/peopleSlice";
import { Logo } from "@/components/ui/Logo";
import styles from "./home.module.css";

type HomeFilter = "all" | "individual" | "community";

const FILTERS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "individual", label: "Individual" },
  { id: "community", label: "Community" },
];

/**
 * Home discovery feed — vibe chooser, plan cards, and people to meet.
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
  const people = useAppSelector(selectPeople).slice(0, 8);
  const joined = useAppSelector(selectJoinedMap);
  const plansStatus = useAppSelector(selectHomePlansStatus);
  const plansError = useAppSelector(selectHomePlansError);
  const plansLoading = plansStatus === "idle" || plansStatus === "loading";
  const heroRef = useRef<HTMLElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<HomeFilter>("all");
  const [dockVisible, setDockVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readWishlist());
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const root = hero.closest("[data-app-scroll]");
    const observer = new IntersectionObserver(
      ([entry]) => setDockVisible(!entry.isIntersecting),
      {
        root: root instanceof Element ? root : null,
        rootMargin: "-72px 0px 0px 0px",
        threshold: 0,
      },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchHomePlans({ userId, location: loc }));
    void dispatch(fetchPeopleCards({ userId, location: loc }));
  }, [dispatch, storedLocation, userId]);

  function retry() {
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchHomePlans({ userId, location: loc, force: true }));
    void dispatch(fetchPeopleCards({ userId, location: loc, force: true }));
  }

  function applyFilter(next: HomeFilter) {
    setFilter(next);
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const plans = nearbyPlans.filter((plan) => {
    if (filter === "individual") return plan.visibility !== "community";
    if (filter === "community") return plan.visibility === "community";
    return true;
  });
  const heading =
    filter === "individual"
      ? "Individual plans"
      : filter === "community"
        ? "Group plans"
        : "Plans for you";
  const showDock = dockVisible || filter !== "all";

  const peopleStrip =
    people.length > 0 ? (
      <section className={styles.people} aria-label="People you may like">
        <div className={styles.peopleHead}>
          <strong>People you may like</strong>
          <Link href="/dashboard/people" className={styles.seeAll}>
            See all
          </Link>
        </div>
        <div className={styles.peopleRow}>
          {people.map((person) => (
            <Link
              key={person.id}
              href={`/dashboard/people/${person.id}`}
              className={styles.person}
            >
              <span className={styles.personAvatar}>
                {person.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.avatarUrl} alt="" />
                ) : (
                  (person.name[0] || "V").toUpperCase()
                )}
              </span>
              <b>{person.name.split(" ")[0]}</b>
              <span>{person.interests[0] || person.distanceLabel || "Member"}</span>
            </Link>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className={styles.page}>
      <LocationPrompt />
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>
            <h1>
              <Logo height={40} priority />
            </h1>
          </div>
          <p className={styles.tagline}>Find activities and people to join.</p>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell />
          <Link href="/dashboard/profile" className={styles.avatar} aria-label="Open profile">
            {initial}
          </Link>
        </div>
      </header>

      <section className={styles.vibe} ref={heroRef}>
        <div className={styles.vibeCopy}>
          <p className={styles.kicker}>Start with a vibe</p>
          <h2>What would you like to do?</h2>
          <p>Find a plan, meet someone new, or explore a community.</p>
        </div>
        <div className={styles.vibeActions}>
          <button type="button" className={styles.vibeAction} onClick={() => applyFilter("individual")}>
            <UserIcon />
            <span>Individual plans</span>
          </button>
          <button type="button" className={styles.vibeAction} onClick={() => applyFilter("community")}>
            <GroupIcon />
            <span>Group plans</span>
          </button>
          <Link href="/dashboard/people" className={styles.vibeAction}>
            <PeopleIcon />
            <span>Find people</span>
          </Link>
        </div>
      </section>

      <div className={`${styles.dock} ${showDock ? styles.dockVisible : ""}`}>
        <div className={styles.segments} role="tablist" aria-label="Plan type">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? styles.segmentActive : styles.segment}
              onClick={() => applyFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
          <Link href="/dashboard/explore" className={styles.sliders} aria-label="More filters">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div className={styles.feedHead} ref={plansRef}>
        <h2>{heading}</h2>
        <Link href="/dashboard/explore" className={styles.seeAll}>
          See all plans
        </Link>
      </div>

      {plansLoading && nearbyPlans.length === 0 ? (
        <PlanCardSkeleton count={2} />
      ) : plansError && nearbyPlans.length === 0 ? (
        <SectionError message={plansError} onRetry={retry} />
      ) : plans.length === 0 ? (
        <div className={styles.empty}>
          <h3>{filter === "all" ? "No plans nearby" : "No plans in this filter"}</h3>
          <p>
            {filter === "all"
              ? "Be the first to create one in your area."
              : "Try another vibe, or post a plan of your own."}
          </p>
        </div>
      ) : (
        <div className={styles.feed}>
          {plans.map((plan, index) => (
            <div key={plan.id} style={{ display: "contents" }}>
              <HomePlanCard
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
              {index === 1 ? peopleStrip : null}
            </div>
          ))}
          {plans.length < 2 ? peopleStrip : null}
        </div>
      )}

      {plans.length === 0 ? peopleStrip : null}

      <Link href="/dashboard/explore" className={styles.explore}>
        Explore all plans
      </Link>
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 19c.6-3.2 2.6-5 6.5-5s5.9 1.8 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 18c.4-2.4 1.8-3.6 4.2-3.6s3.8 1.2 4.2 3.6M11.8 18c.4-2.4 1.8-3.6 4.2-3.6s3.8 1.2 4.2 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="6" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 19c.3-2.4 1.8-3.6 5-3.6s4.7 1.2 5 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
