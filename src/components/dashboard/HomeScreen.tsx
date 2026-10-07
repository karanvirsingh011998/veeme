"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import {
  joinPlan,
  listPlansPage,
  type PlanWithMeta,
} from "@/lib/plans/service";
import {
  buildCreatorMapAsync,
  listPeopleYouMayConnectWith,
  type PeopleCard,
} from "@/lib/people/service";
import { greetingLabel } from "@/lib/dashboard/demo-data";
import {
  readApproxLocation,
  type ApproxLocation,
} from "@/lib/location/geo";
import { NotificationBell } from "@/components/dashboard/notifications/NotificationBell";
import {
  PlanCardSkeleton,
  SectionError,
  UserCardSkeleton,
} from "@/components/dashboard/ui/Skeletons";
import styles from "./social.module.css";
import ui from "./app-ui.module.css";

/**
 * Personalized home — plans near you, people, upcoming plans.
 */
export function HomeScreen() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const firstName =
    profile?.first_name?.trim() || user?.firstName?.trim() || "there";

  const [location, setLocation] = useState<ApproxLocation | null>(null);
  const [nearbyPlans, setNearbyPlans] = useState<PlanWithMeta[]>([]);
  const [people, setPeople] = useState<PeopleCard[]>([]);
  const [upcoming, setUpcoming] = useState<PlanWithMeta[]>([]);
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [plansLoading, setPlansLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const firstLoad = !hasLoadedRef.current;
    if (firstLoad) {
      setPlansLoading(true);
      setPeopleLoading(true);
    }
    const loc = location || readApproxLocation();

    const plansTask = (async () => {
      try {
        const page = await listPlansPage(
          { distanceKm: loc?.lat != null ? "25" : "all" },
          { userLocation: loc, viewerId: userId, limit: 12 },
        );
        const creators = await buildCreatorMapAsync(
          page.plans.map((plan) => plan.creatorId),
        );
        const named = page.plans.map((plan) => {
          const creator = creators.get(plan.creatorId);
          return creator
            ? { ...plan, creatorName: creator.name, creatorAvatar: creator.avatar }
            : plan;
        });
        setNearbyPlans(named.slice(0, 6));
        setUpcoming(
          named.filter((plan) => plan.viewerJoined).slice(0, 4),
        );
        const map: Record<string, boolean> = {};
        for (const plan of named) map[plan.id] = Boolean(plan.viewerJoined);
        setJoined(map);
        setPlansError(null);
      } catch {
        setPlansError("Couldn't load plans.");
      } finally {
        setPlansLoading(false);
      }
    })();

    const peopleTask = (async () => {
      try {
        const peopleCards = await listPeopleYouMayConnectWith(userId, {
          userLocation: loc,
        });
        setPeople(peopleCards.slice(0, 4));
        setPeopleError(null);
      } catch {
        setPeopleError("Couldn't load people.");
      } finally {
        setPeopleLoading(false);
      }
    })();

    await Promise.all([plansTask, peopleTask]);
    hasLoadedRef.current = true;
  }, [location, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className={ui.page}>
      <LocationPrompt onResolved={setLocation} />
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
          <SectionError message={plansError} onRetry={() => void refresh()} />
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
                onJoin={async (id) => {
                  if (!userId) return;
                  setJoined((prev) => ({ ...prev, [id]: true }));
                  const result = await joinPlan(id, userId);
                  if (!result.ok) {
                    setJoined((prev) => ({ ...prev, [id]: false }));
                    setPlansError(result.error);
                  }
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
          <SectionError message={peopleError} onRetry={() => void refresh()} />
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
