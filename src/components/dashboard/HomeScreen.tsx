"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import { greetingLabel } from "@/lib/dashboard/demo-data";
import { readApproxLocation } from "@/lib/location/geo";
import { NotificationBell } from "@/components/dashboard/notifications/NotificationBell";
import {
  PlanCardSkeleton,
  SectionError,
  UserCardSkeleton,
} from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectHomePlans,
  selectHomePlansError,
  selectHomePlansStatus,
  selectHomeUpcoming,
  selectJoinedMap,
} from "@/store/selectors/planSelectors";
import {
  selectApproxLocation,
  selectPeopleError,
  selectPeoplePreview,
  selectPeopleStatus,
} from "@/store/selectors/sharedSelectors";
import { fetchHomePlans, joinPlanOptimistic } from "@/store/slices/plansSlice";
import { fetchPeopleCards } from "@/store/slices/peopleSlice";
import styles from "./social.module.css";
import ui from "./app-ui.module.css";

/**
 * Personalized home — plans near you, people, upcoming plans.
 */
export function HomeScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const firstName =
    profile?.first_name?.trim() || user?.firstName?.trim() || "there";
  const storedLocation = useAppSelector(selectApproxLocation);
  const nearbyPlans = useAppSelector(selectHomePlans).slice(0, 6);
  const people = useAppSelector(selectPeoplePreview);
  const upcoming = useAppSelector(selectHomeUpcoming);
  const joined = useAppSelector(selectJoinedMap);
  const plansStatus = useAppSelector(selectHomePlansStatus);
  const peopleStatus = useAppSelector(selectPeopleStatus);
  const plansError = useAppSelector(selectHomePlansError);
  const peopleError = useAppSelector(selectPeopleError);
  const plansLoading = plansStatus === "idle" || plansStatus === "loading";
  const peopleLoading = peopleStatus === "idle" || peopleStatus === "loading";

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

  return (
    <div className={ui.page}>
      <LocationPrompt />
      <header className={ui.header}>
        <div className={ui.logo}>Vemee</div>
        <NotificationBell />
      </header>

      <div className={ui.content}>
        <p className={ui.greeting}>{greetingLabel()}</p>
        <h1 className={ui.title}>{firstName}</h1>

        <h2 className={styles.sectionLabel}>Plans near you</h2>
        {plansLoading && nearbyPlans.length === 0 ? (
          <PlanCardSkeleton count={2} />
        ) : plansError && nearbyPlans.length === 0 ? (
          <SectionError message={plansError} onRetry={retry} />
        ) : nearbyPlans.length === 0 ? (
          <div className={styles.empty}>
            <h3>No plans nearby</h3>
            <p>Be the first to create one in your area.</p>
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
            {nearbyPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                viewerId={userId}
                joined={joined[plan.id]}
                onJoin={(id) => {
                  if (!userId) return;
                  void dispatch(joinPlanOptimistic({ planId: id, userId }));
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.headerRow} style={{ marginTop: 8 }}>
          <h2 className={styles.sectionLabel} style={{ margin: 0 }}>
            People you may connect with
          </h2>
          <Link href="/dashboard/people" className={styles.sub}>
            See all
          </Link>
        </div>
        {peopleLoading && people.length === 0 ? (
          <UserCardSkeleton count={3} />
        ) : peopleError && people.length === 0 ? (
          <SectionError message={peopleError} onRetry={retry} />
        ) : people.length === 0 ? (
          <div className={styles.empty}>
            <h3>We&apos;re still finding your people.</h3>
            <p>Create a plan to improve recommendations.</p>
          </div>
        ) : (
          <div className={styles.peopleGrid}>
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/dashboard/people/${person.id}`}
                className={styles.personCard}
              >
                <div className={styles.creatorRow}>
                  <span className={styles.avatar}>
                    {(person.name[0] || "V").toUpperCase()}
                  </span>
                  <div>
                    <strong>{person.name}</strong>
                    <p className={styles.sub} style={{ margin: 0 }}>
                      {person.distanceLabel || "Member"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2 className={styles.sectionLabel}>Your upcoming plans</h2>
        {plansLoading && upcoming.length === 0 ? (
          <PlanCardSkeleton count={1} />
        ) : upcoming.length === 0 ? (
          <p className={styles.sub}>
            Plans you create or join will show up here.
          </p>
        ) : (
          <div className={styles.planGrid}>
            {upcoming.map((plan) => (
              <PlanCard key={plan.id} plan={plan} viewerId={userId} joined />
            ))}
          </div>
        )}

        <h2 className={styles.sectionLabel}>Recommended for you</h2>
        <div className={styles.actions}>
          <Link
            href="/dashboard/explore"
            className={`${styles.btn} ${styles.btnSecondary}`}
          >
            Explore all plans
          </Link>
          <Link
            href="/dashboard/people"
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            Find people
          </Link>
        </div>
      </div>
    </div>
  );
}
