"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { COMMUNITY_LIST } from "@/lib/dashboard/demo-data";
import { respondToConnection, sendConnectRequest } from "@/lib/connections/service";
import { getOrCreateDirectConversation } from "@/lib/chat/service";
import { readApproxLocation } from "@/lib/location/geo";
import {
  savePersonRating,
  type PersonRatingTier,
} from "@/lib/people/ratings";
import { PersonRating } from "@/components/dashboard/people/PersonRating";
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
  selectOwnedCommunities,
  selectPendingConnections,
  selectPeople,
  selectPeopleError,
  selectPeopleStatus,
} from "@/store/selectors/sharedSelectors";
import { fetchOwnedCommunities } from "@/store/slices/communitiesSlice";
import {
  fetchPeopleCards,
  fetchPeopleConnections,
  setPersonConnection,
  setViewerRating,
} from "@/store/slices/peopleSlice";
import styles from "../social.module.css";

type PeopleView = "people" | "community";

const VIEWS: { id: PeopleView; label: string }[] = [
  { id: "people", label: "People" },
  { id: "community", label: "Communities" },
];

/**
 * People you may connect with — real profiles only.
 * All shows people and communities. Incoming requests appear at the top.
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
  const ownedCommunities = useAppSelector(selectOwnedCommunities);
  const error = useAppSelector(selectPeopleError);
  const [view, setView] = useState<PeopleView>("people");
  const [busyId, setBusyId] = useState<string | null>(null);
  const showPeople = view !== "community";
  const showCommunities = view !== "people";
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
    void dispatch(fetchOwnedCommunities({ userId }));
  }, [dispatch, storedLocation, userId]);

  function retry() {
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchPeopleCards({ userId, location: loc, force: true }));
    void dispatch(fetchPeopleConnections({ userId, location: loc, force: true }));
  }

  async function onRate(personId: string, tier: PersonRatingTier) {
    if (!userId) return;
    const previous =
      people.find((person) => person.id === personId)?.viewerRating ?? null;
    const next = previous === tier ? null : tier;
    dispatch(setViewerRating({ id: personId, tier: next }));
    const result = await savePersonRating(userId, personId, next);
    if (!result.ok) {
      dispatch(setViewerRating({ id: personId, tier: previous }));
      return;
    }
    const loc = storedLocation ?? readApproxLocation();
    void dispatch(fetchPeopleCards({ userId, location: loc, force: true }));
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
          <h1 className={styles.title}>Meet people</h1>
          <p className={styles.sub}>
            Connect through shared interests and activities.
          </p>
        </div>
      </div>

      <div className={styles.typeSwitch} role="tablist" aria-label="People or communities">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={view === item.id ? `${styles.typeTab} ${styles.typeTabOn}` : styles.typeTab}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.listHead}>
        <h2 className={styles.sectionLabel}>
          {view === "people" ? "People you may connect with" : "Communities you may like"}
        </h2>
        <span className={styles.listCount}>
          {view === "community"
            ? `${ownedCommunities.length + COMMUNITY_LIST.length} communities`
            : `${people.length} members`}
        </span>
      </div>

      {loading && people.length === 0 && pending.length === 0 ? (
        <UserCardSkeleton count={4} />
      ) : null}
      {error && people.length === 0 && pending.length === 0 ? (
        <SectionError message={error} onRetry={retry} />
      ) : null}

      {showPeople && !loading && pending.length > 0 ? (
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

      {showPeople && !loading && accepted.length > 0 ? (
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

      {showPeople && !loading && people.length === 0 ? (
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
      ) : showPeople && !loading ? (
        <div className={styles.photoGrid}>
          {people.map((person) => (
            <article key={person.id} className={styles.photoCard}>
              <Link href={`/dashboard/people/${person.id}`} className={styles.photo}>
                {person.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.avatarUrl} alt="" />
                ) : (
                  <span className={styles.photoFallback}>
                    {(person.name[0] || "V").toUpperCase()}
                  </span>
                )}
                <span className={styles.online} aria-hidden="true" />
                {person.interests[0] ? (
                  <span className={styles.photoTag}>{person.interests[0]}</span>
                ) : null}
              </Link>
              <div className={styles.photoBody}>
                <h3>{person.name}</h3>
                <div className={styles.photoArea}>
                  {person.distanceLabel || person.city || "Nearby"}
                  {person.verified ? " · Verified" : ""}
                </div>
                <p>
                  {person.bio ||
                    "Looking for people to do activities and explore together."}
                </p>
                {person.interests.length > 0 ? (
                  <div className={styles.interestChips}>
                    {person.interests.slice(0, 2).map((interest) => (
                      <span key={interest} className={styles.chip}>
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : null}
                <PersonRating
                  value={person.viewerRating}
                  onChange={(tier) => void onRate(person.id, tier)}
                />
                <div className={styles.photoActions}>
                  {person.connectionStatus === "connected" ? (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => void onChat(person.id)}
                    >
                      Chat
                    </button>
                  ) : person.connectionStatus === "pending_sent" ? (
                    <span className={`${styles.btn} ${styles.btnGhost}`}>Pending</span>
                  ) : person.connectionStatus === "pending_received" ? (
                    <span className={`${styles.btn} ${styles.btnGhost}`}>Respond</span>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={busyId === person.id}
                      onClick={() => void onConnect(person.id)}
                    >
                      {busyId === person.id ? "…" : "Connect"}
                    </button>
                  )}
                  <Link
                    href={`/dashboard/people/${person.id}`}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                  >
                    Profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {showCommunities ? (
        <div className={styles.communityGrid}>
          {ownedCommunities.map((community) => (
            <article key={community.id} className={styles.communityTile}>
              <div className={styles.communityCover}>
                <span>{community.icon}</span>
              </div>
              <div className={styles.communityBody}>
                <div className={styles.communityKicker}>Member</div>
                <h3>{community.name}</h3>
                <p>
                  {community.description ||
                    `${community.memberCount} ${community.memberCount === 1 ? "member" : "members"}`}
                </p>
                <div className={styles.photoActions}>
                  <Link href="/dashboard/community" className={`${styles.btn} ${styles.btnSecondary}`}>
                    Explore
                  </Link>
                  <span className={`${styles.btn} ${styles.btnGhost}`}>Joined</span>
                </div>
              </div>
            </article>
          ))}
          {COMMUNITY_LIST.map((community) => (
            <article key={community.name} className={styles.communityTile}>
              <div className={styles.communityCover}>
                <span>{community.icon}</span>
              </div>
              <div className={styles.communityBody}>
                <div className={styles.communityKicker}>Discover community</div>
                <h3>{community.name}</h3>
                <p>{community.members}</p>
                <Link
                  href="/dashboard/community"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Explore
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
