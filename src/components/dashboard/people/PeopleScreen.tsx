"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { respondToConnection, sendConnectRequest } from "@/lib/connections/service";
import { getOrCreateDirectConversation } from "@/lib/chat/service";
import { readApproxLocation } from "@/lib/location/geo";
import { LocationPrompt } from "@/components/dashboard/location/LocationPrompt";
import {
  SectionError,
  UserCardSkeleton,
} from "@/components/dashboard/ui/Skeletons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAcceptedConnections,
  selectApproxLocation,
  selectConnectionNames,
  selectConnectionsStatus,
  selectPendingConnections,
  selectPeople,
  selectPeopleError,
  selectPeopleStatus,
} from "@/store/selectors/sharedSelectors";
import {
  fetchPeopleCards,
  fetchPeopleConnections,
  setPersonConnection,
} from "@/store/slices/peopleSlice";
import styles from "../social.module.css";

/**
 * People you may connect with — real profiles only.
 * Incoming requests appear at the top (Accept / Decline → then Chat).
 */
export function PeopleScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const router = useRouter();
  const userId = profile?.id || user?.id || "";
  const storedLocation = useAppSelector(selectApproxLocation);
  const people = useAppSelector(selectPeople);
  const pending = useAppSelector(selectPendingConnections);
  const accepted = useAppSelector(selectAcceptedConnections);
  const names = useAppSelector(selectConnectionNames);
  const peopleStatus = useAppSelector(selectPeopleStatus);
  const connectionsStatus = useAppSelector(selectConnectionsStatus);
  const error = useAppSelector(selectPeopleError);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loading =
    people.length === 0 &&
    pending.length === 0 &&
    peopleStatus !== "failed" &&
    connectionsStatus !== "failed" &&
    (peopleStatus !== "succeeded" || connectionsStatus !== "succeeded");

  useEffect(() => {
    if (!userId) return;
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchPeopleCards({ userId, location: loc }));
    void dispatch(fetchPeopleConnections({ userId, location: loc }));
  }, [dispatch, storedLocation, userId]);

  function retry() {
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchPeopleCards({ userId, location: loc, force: true }));
    void dispatch(fetchPeopleConnections({ userId, location: loc, force: true }));
  }

  async function onConnect(personId: string) {
    if (!userId) return;
    setBusyId(personId);
    dispatch(setPersonConnection({ id: personId, status: "pending_sent" }));
    const result = await sendConnectRequest(userId, personId);
    setBusyId(null);
    if (!result.ok) {
      dispatch(setPersonConnection({ id: personId, status: "none" }));
      return;
    }
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchPeopleConnections({ userId, location: loc, force: true }));
  }

  async function onRespond(connectionId: string, accept: boolean, otherId: string) {
    if (!userId) return;
    setBusyId(connectionId);
    const result = await respondToConnection(connectionId, userId, accept);
    setBusyId(null);
    const loc = storedLocation ?? readApproxLocation();
    await dispatch(fetchPeopleConnections({ userId, location: loc, force: true }));
    await dispatch(fetchPeopleCards({ userId, location: loc, force: true }));
    if (result.ok && accept) {
      const conversation = await getOrCreateDirectConversation(userId, otherId);
      router.push(`/dashboard/chat/${conversation.id}`);
    }
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
      {error && people.length === 0 && pending.length === 0 ? (
        <SectionError message={error} onRetry={retry} />
      ) : null}

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
