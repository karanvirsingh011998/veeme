"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  formatPlanWhen,
  formatPostedAt,
  getParticipantAsync,
  getPlan,
  joinPlan,
  listPlanMembers,
  type PlanMember,
  type PlanWithMeta,
} from "@/lib/plans/service";
import {
  buildCreatorMapAsync,
  getPublicProfileCardAsync,
} from "@/lib/people/service";
import {
  listConnectionsForAsync,
  sendConnectRequest,
  type Connection,
} from "@/lib/connections/service";
import { getOrCreateDirectConversation } from "@/lib/chat/service";
import { readApproxLocation } from "@/lib/location/geo";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectPlanById } from "@/store/selectors/planSelectors";
import { selectApproxLocation } from "@/store/selectors/sharedSelectors";
import { markJoined, selectPlan, upsertPlans } from "@/store/slices/plansSlice";
import styles from "../social.module.css";

type PlanDetailScreenProps = {
  planId: string;
};

/**
 * Plan detail — creator can’t join; members can connect & chat.
 */
export function PlanDetailScreen({ planId }: PlanDetailScreenProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const userId = profile?.id || user?.id || "";
  const dispatch = useAppDispatch();
  const cached = useAppSelector((state) => selectPlanById(state, planId));
  const storedLocation = useAppSelector(selectApproxLocation);
  const [plan, setPlan] = useState<PlanWithMeta | null>(cached ?? null);
  const [members, setMembers] = useState<PlanMember[]>([]);
  const [memberCities, setMemberCities] = useState<Record<string, string>>({});
  const [joined, setJoined] = useState(Boolean(cached?.viewerJoined));
  const [busy, setBusy] = useState(false);
  const [chatBusyId, setChatBusyId] = useState<string | null>(null);
  const [connectBusyId, setConnectBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);
  const [connections, setConnections] = useState<Connection[]>([]);

  const isOwner = Boolean(plan && userId && plan.creatorId === userId);

  useEffect(() => {
    dispatch(selectPlan(planId));
    let cancelled = false;
    const showSkeleton = !cached;

    async function load() {
      if (showSkeleton) setLoading(true);
      const loc = storedLocation ?? readApproxLocation();
      const base = await getPlan(planId, { userLocation: loc });
      if (cancelled) return;
      if (!base) {
        if (showSkeleton) setPlan(null);
        setLoading(false);
        return;
      }
      const creators = await buildCreatorMapAsync([base.creatorId]);
      if (cancelled) return;
      const enriched = await getPlan(planId, { userLocation: loc, creators });
      if (cancelled) return;
      const nextPlan = enriched ?? base;
      setPlan(nextPlan);
      dispatch(upsertPlans([nextPlan]));
      const planMembers = await listPlanMembers(planId);
      if (cancelled) return;
      setMembers(planMembers);
      const cities: Record<string, string> = {};
      await Promise.all(
        planMembers.map(async (member) => {
          const card = await getPublicProfileCardAsync(member.userId, userId);
          if (card?.city) cities[member.userId] = card.city;
        }),
      );
      if (cancelled) return;
      setMemberCities(cities);
      if (userId) {
        setConnections(await listConnectionsForAsync(userId));
        if (nextPlan.creatorId === userId) {
          setJoined(true);
        } else {
          const part = await getParticipantAsync(planId, userId);
          setJoined(part?.status === "joined");
        }
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
    // `cached` is only the first paint. Depending on it would refetch after upsert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, planId, storedLocation, userId]);

  async function onJoin() {
    if (!userId || !plan || isOwner) return;
    setBusy(true);
    setError(null);
    const result = await joinPlan(plan.id, userId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setJoined(true);
    dispatch(markJoined({ planId: plan.id, joined: true }));
    setMembers(await listPlanMembers(planId));
  }

  async function onChatWith(personId: string) {
    if (!userId || personId === userId) return;
    setChatBusyId(personId);
    try {
      const conversation = await getOrCreateDirectConversation(userId, personId);
      router.push(`/dashboard/chat/${conversation.id}`);
    } finally {
      setChatBusyId(null);
    }
  }

  async function onConnect(personId: string) {
    if (!userId || personId === userId) return;
    setConnectBusyId(personId);
    await sendConnectRequest(userId, personId);
    setConnections(await listConnectionsForAsync(userId));
    setConnectBusyId(null);
  }

  async function onShare() {
    if (!plan) return;
    const url = `${window.location.origin}/dashboard/plans/${plan.id}`;
    if (navigator.share) {
      await navigator.share({ title: plan.title, text: plan.description, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    alert("Plan link copied.");
  }

  function connectionLabel(personId: string): string {
    if (!userId) return "Connect";
    const c = connections.find(
      (row) =>
        (row.requesterId === userId && row.recipientId === personId) ||
        (row.requesterId === personId && row.recipientId === userId),
    );
    if (!c) return "Connect";
    if (c.status === "accepted") return "Connected";
    if (c.status === "pending") {
      return c.requesterId === userId ? "Request sent" : "Respond in People";
    }
    return "Connect";
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <ScreenLoading message="Loading plan…" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.empty}>
        <h3>Plan not found</h3>
        <p>This plan may have been removed.</p>
        <div className={styles.emptyActions}>
          <Link
            href="/dashboard/explore"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Explore plans
          </Link>
        </div>
      </div>
    );
  }

  const canInteractWithMembers = isOwner || joined;

  return (
    <div className={styles.page}>
      <p className={styles.sub}>
        <Link href="/dashboard/explore">← Explore</Link>
      </p>

      <div className={styles.detailHero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={plan.image} alt="" />
      </div>

      <span className={styles.category}>
        {plan.categoryIcon} {plan.categoryLabel}
      </span>
      <h1 className={styles.title} style={{ marginTop: 8 }}>
        {plan.title}
      </h1>
      <p className={styles.sub}>{plan.description}</p>

      <div className={styles.detailBlock}>
        <div className={styles.metaRow}>
          <span>🗓 {formatPlanWhen(plan.date, plan.time)}</span>
          <span>📍 {plan.locationLabel}</span>
          {plan.distanceLabel ? <span>{plan.distanceLabel}</span> : null}
        </div>
        <p className={styles.sub} style={{ marginTop: 10 }}>
          {plan.joinedCount} of {plan.peopleNeeded + 1} people joined ·{" "}
          {plan.spotsLeft} spot{plan.spotsLeft === 1 ? "" : "s"} left
        </p>
        <p className={styles.sub} style={{ marginTop: 4 }}>
          Posted {formatPostedAt(plan.createdAt)}
        </p>
      </div>

      <div className={styles.detailBlock}>
        <div className={styles.creatorRow}>
          <span className={styles.avatar}>
            {(plan.creatorName?.[0] || "V").toUpperCase()}
          </span>
          <div>
            <strong>
              {isOwner
                ? "Created by you"
                : `Created by ${plan.creatorName || "Plan creator"}`}
            </strong>
            <p className={styles.sub} style={{ margin: 0 }}>
              {formatPlanWhen(plan.date, plan.time)}
            </p>
          </div>
        </div>
        {!isOwner ? (
          <div className={styles.actions} style={{ marginTop: 12 }}>
            <Link
              href={`/dashboard/people/${encodeURIComponent(plan.creatorId)}`}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              View profile
            </Link>
            {(() => {
              const label = connectionLabel(plan.creatorId);
              if (label === "Connect") {
                return (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={connectBusyId === plan.creatorId}
                    onClick={() => void onConnect(plan.creatorId)}
                  >
                    {connectBusyId === plan.creatorId ? "…" : "Connect"}
                  </button>
                );
              }
              return (
                <span className={`${styles.btn} ${styles.btnGhost}`}>
                  {label === "Connected" ? "Connected ✓" : label}
                </span>
              );
            })()}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => void onChatWith(plan.creatorId)}
              disabled={chatBusyId === plan.creatorId}
            >
              Chat
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.detailBlock}>
        <strong>People in this plan</strong>
        <p className={styles.sub} style={{ marginTop: 4 }}>
          {canInteractWithMembers
            ? "Connect or chat with everyone who’s in."
            : "Join the plan to chat with everyone here."}
        </p>
        <div className={styles.memberList}>
          {members.map((member) => {
            const self = member.userId === userId;
            const conn = connectionLabel(member.userId);
            const city = memberCities[member.userId];
            return (
              <div key={member.userId} className={styles.memberRow}>
                <span className={styles.avatar} aria-hidden="true">
                  {(member.name[0] || "V").toUpperCase()}
                </span>
                <div>
                  <strong>
                    {self ? `${member.name} (you)` : member.name}
                  </strong>
                  <p className={styles.sub} style={{ margin: 0 }}>
                    {member.isCreator ? "Plan creator" : "Joined"}
                    {city ? ` · ${city}` : ""}
                  </p>
                </div>
                {!self && canInteractWithMembers ? (
                  <div className={styles.memberActions}>
                    {conn !== "Connected" && conn !== "Request sent" ? (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        disabled={connectBusyId === member.userId}
                        onClick={() => void onConnect(member.userId)}
                      >
                        {connectBusyId === member.userId ? "…" : "Connect"}
                      </button>
                    ) : (
                      <span className={`${styles.btn} ${styles.btnGhost}`}>
                        {conn === "Connected" ? "Connected ✓" : "Request sent"}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={chatBusyId === member.userId}
                      onClick={() => void onChatWith(member.userId)}
                    >
                      Chat
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        {isOwner ? (
          <span className={`${styles.btn} ${styles.btnGhost}`}>
            You’re the plan creator
          </span>
        ) : joined ? (
          <span className={`${styles.btn} ${styles.btnGhost}`}>Joined ✓</span>
        ) : (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => void onJoin()}
            disabled={busy}
          >
            {busy ? "Joining…" : "Join Plan"}
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => void onShare()}
        >
          Share
        </button>
      </div>
    </div>
  );
}
