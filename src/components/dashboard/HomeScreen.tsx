"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import { PlanCard } from "@/components/dashboard/plans/PlanCard";
import {
  getParticipant,
  joinPlan,
  listPlans,
  listUserPlansAsync,
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
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
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
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const loc = location || readApproxLocation();
      const plans = await listPlans(
        { distanceKm: loc?.lat != null ? "25" : "all" },
        { userLocation: loc },
      );
      const creators = await buildCreatorMapAsync(plans.map((p) => p.creatorId));
      const enriched = await listPlans(
        { distanceKm: loc?.lat != null ? "25" : "all" },
        { userLocation: loc, creators },
      );
      setNearbyPlans(enriched.slice(0, 6));

      const map: Record<string, boolean> = {};
      for (const p of enriched) {
        map[p.id] = Boolean(getParticipant(p.id, userId)?.status === "joined");
      }
      setJoined(map);

      const peopleCards = await listPeopleYouMayConnectWith(userId, {
        userLocation: loc,
      });
      setPeople(peopleCards.slice(0, 4));

      const mine = await listUserPlansAsync(userId);
      const upcomingIds = [...mine.created, ...mine.joined].map((p) => p.id);
      const more = await listPlans({}, { userLocation: loc, creators });
      setUpcoming(
        more.filter((p) => upcomingIds.includes(p.id)).slice(0, 4),
      );
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [location, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className={ui.page}>
      <LocationPrompt onResolved={setLocation} />
      <header className={ui.header}>
        <div className={ui.logo}>Vemee</div>
        <Link href="/dashboard/profile" className={ui.iconBtn} aria-label="Profile">
          ☺
        </Link>
      </header>

      <div className={ui.content}>
        <p className={ui.greeting}>{greetingLabel()}</p>
        <h1 className={ui.title}>{firstName}</h1>
        <p className={ui.tagline}>What are you planning to do?</p>

        <div className={styles.homeCta}>
          <h2>Create a Plan</h2>
          <p className={styles.sub} style={{ margin: 0 }}>
            Post what you want to do and find people to join.
          </p>
          <Link
            href="/dashboard/plans/new"
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ width: "fit-content" }}
          >
            Create a Plan
          </Link>
        </div>

        {loading ? (
          <ScreenLoading message="Loading your feed…" />
        ) : (
          <>
            <h2 className={styles.sectionLabel}>Plans near you</h2>
            {nearbyPlans.length === 0 ? (
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
                      await joinPlan(id, userId);
                      void refresh();
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
            {people.length === 0 ? (
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
            {upcoming.length === 0 ? (
              <p className={styles.sub}>
                Plans you create or join will show up here.
              </p>
            ) : (
              <div className={styles.planGrid}>
                {upcoming.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    viewerId={userId}
                    joined
                  />
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
          </>
        )}
      </div>
    </div>
  );
}
