"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  buildCreatorMapAsync,
  listPeopleYouMayConnectWith,
  type PeopleCard,
} from "@/lib/people/service";
import {
  listAcceptedForAsync,
  listPendingForAsync,
  respondToConnection,
  sendConnectRequest,
  type Connection,
} from "@/lib/connections/service";
import { getOrCreateDirectConversation } from "@/lib/chat/service";
import { readApproxLocation } from "@/lib/location/geo";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import {
  SectionError,
  UserCardSkeleton,
} from "@/components/dashboard/ui/Skeletons";
import styles from "../social.module.css";

/**
 * People you may connect with — real profiles only.
 * Incoming requests appear at the top (Accept / Decline → then Chat).
 */
export function PeopleScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const userId = profile?.id || user?.id || "";
  const [people, setPeople] = useState<PeopleCard[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [accepted, setAccepted] = useState<Connection[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const loc = readApproxLocation();
      const [cards, pendingReqs, acceptedRows] = await Promise.all([
        listPeopleYouMayConnectWith(userId, {
          userLocation: loc,
          currentInterests: [],
        }),
        listPendingForAsync(userId),
        listAcceptedForAsync(userId),
      ]);
      setPeople(cards);
      setPending(pendingReqs);
      setAccepted(acceptedRows);

      const ids = new Set<string>();
      for (const req of pendingReqs) ids.add(req.requesterId);
      for (const row of acceptedRows) {
        ids.add(row.requesterId === userId ? row.recipientId : row.requesterId);
      }
      const creators = await buildCreatorMapAsync([...ids]);
      const nextNames: Record<string, string> = {};
      for (const id of ids) {
        nextNames[id] = creators.get(id)?.name || "a member";
      }
      setNames(nextNames);
      setError(null);
    } catch {
      setError("Couldn't load people.");
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onConnect(personId: string) {
    if (!userId) return;
    setBusyId(personId);
    setPeople((current) =>
      current.map((person) =>
        person.id === personId
          ? { ...person, connectionStatus: "pending_sent" }
          : person,
      ),
    );
    const result = await sendConnectRequest(userId, personId);
    setBusyId(null);
    if (!result.ok) {
      setPeople((current) =>
        current.map((person) =>
          person.id === personId
            ? { ...person, connectionStatus: "none" }
            : person,
        ),
      );
      setError(result.error);
      return;
    }
    void refresh();
  }

  async function onRespond(connectionId: string, accept: boolean, otherId: string) {
    if (!userId) return;
    setBusyId(connectionId);
    const result = await respondToConnection(connectionId, userId, accept);
    setBusyId(null);
    if (result.ok && accept) {
      const conversation = await getOrCreateDirectConversation(userId, otherId);
      await refresh();
      router.push(`/dashboard/chat/${conversation.id}`);
      return;
    }
    void refresh();
  }

  async function onChat(personId: string) {
    if (!userId) return;
    const conversation = await getOrCreateDirectConversation(userId, personId);
    router.push(`/dashboard/chat/${conversation.id}`);
  }

  return (
    <div className={styles.page}>
      <LocationPrompt />
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>People</h1>
          <p className={styles.sub}>
            Connection requests show here. Accept to open chat.
          </p>
        </div>
      </div>

      {loading && people.length === 0 && pending.length === 0 ? (
        <UserCardSkeleton count={4} />
      ) : null}
      {error ? <SectionError message={error} onRetry={() => void refresh()} /> : null}

      {!loading && pending.length > 0 ? (
        <>
          <h2 className={styles.sectionLabel}>
            Connection requests ({pending.length})
          </h2>
          <div className={styles.peopleGrid}>
            {pending.map((req) => (
              <div key={req.id} className={styles.personCard}>
                <div className={styles.creatorRow}>
                  <span className={styles.avatar}>
                    {(names[req.requesterId]?.[0] || "V").toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {names[req.requesterId] || "a member"}
                    </strong>
                    <p className={styles.sub} style={{ margin: 0 }}>
                      Wants to connect with you
                    </p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={busyId === req.id}
                    onClick={() =>
                      void onRespond(req.id, true, req.requesterId)
                    }
                  >
                    {busyId === req.id ? "…" : "Accept & Chat"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    disabled={busyId === req.id}
                    onClick={() =>
                      void onRespond(req.id, false, req.requesterId)
                    }
                  >
                    Decline
                  </button>
                  <Link
                    href={`/dashboard/people/${req.requesterId}`}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                  >
                    View profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {!loading && accepted.length > 0 ? (
        <>
          <h2 className={styles.sectionLabel}>Your connections</h2>
          <div className={styles.peopleGrid}>
            {accepted.map((row) => {
              const otherId =
                row.requesterId === userId ? row.recipientId : row.requesterId;
              return (
                <div key={row.id} className={styles.personCard}>
                  <div className={styles.creatorRow}>
                    <span className={styles.avatar}>
                      {(names[otherId]?.[0] || "V").toUpperCase()}
                    </span>
                    <div>
                      <strong>{names[otherId] || "Member"}</strong>
                      <p className={styles.sub} style={{ margin: 0 }}>
                        Connected ✓
                      </p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => void onChat(otherId)}
                    >
                      Chat
                    </button>
                    <Link
                      href={`/dashboard/people/${otherId}`}
                      className={`${styles.btn} ${styles.btnSecondary}`}
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {!loading ? (
        <h2 className={styles.sectionLabel}>People you may connect with</h2>
      ) : null}

      {!loading && people.length === 0 ? (
        <div className={styles.empty}>
          <h3>We&apos;re finding people near you.</h3>
          <p>
            Create a plan or explore activities to start connecting. We only
            show real members — never fake profiles.
          </p>
          <div className={styles.emptyActions}>
            <Link
              href="/dashboard/plans/new"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Create a Plan
            </Link>
            <Link
              href="/dashboard/explore"
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Explore Plans
            </Link>
          </div>
        </div>
      ) : !loading ? (
        <div className={styles.peopleGrid}>
          {people.map((person) => (
            <article key={person.id} className={styles.personCard}>
              <div className={styles.creatorRow}>
                <span className={styles.avatar}>
                  {(person.name[0] || "V").toUpperCase()}
                </span>
                <div>
                  <strong>{person.name}</strong>
                  <p className={styles.sub} style={{ margin: 0 }}>
                    {person.distanceLabel
                      ? `📍 ${person.distanceLabel}`
                      : "Location not set"}
                    {person.verified ? " · Verified" : ""}
                  </p>
                </div>
              </div>
              {person.interests.length > 0 ? (
                <div className={styles.interestChips}>
                  {person.interests.map((interest) => (
                    <span key={interest} className={styles.chip}>
                      {interest}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className={styles.sub}>
                {person.bio ||
                  "Looking for people to do activities and explore together."}
              </p>
              <div className={styles.actions}>
                <Link
                  href={`/dashboard/people/${person.id}`}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  View Profile
                </Link>
                {person.connectionStatus === "connected" ? (
                  <>
                    <span className={`${styles.btn} ${styles.btnGhost}`}>
                      Connected ✓
                    </span>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => void onChat(person.id)}
                    >
                      Chat
                    </button>
                  </>
                ) : person.connectionStatus === "pending_sent" ? (
                  <span className={`${styles.btn} ${styles.btnGhost}`}>
                    Request Sent
                  </span>
                ) : person.connectionStatus === "pending_received" ? (
                  <span className={`${styles.btn} ${styles.btnGhost}`}>
                    Respond above
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={busyId === person.id}
                    onClick={() => void onConnect(person.id)}
                  >
                    {busyId === person.id ? "Sending…" : "Connect"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
