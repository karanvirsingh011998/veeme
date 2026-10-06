"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  getPublicProfileCardAsync,
  type PeopleCard,
} from "@/lib/people/service";
import { listUserPlansAsync } from "@/lib/plans/service";
import { sendConnectRequest } from "@/lib/connections/service";
import { getOrCreateDirectConversation } from "@/lib/chat/service";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
import styles from "../social.module.css";

type PersonProfileScreenProps = {
  /** Optional override; defaults to the `[id]` route param. */
  personId?: string;
};

/**
 * Public activity-focused profile (no private contact fields).
 */
export function PersonProfileScreen({
  personId: personIdProp,
}: PersonProfileScreenProps) {
  const params = useParams<{ id?: string }>();
  const personId = (personIdProp || params?.id || "").toString();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const viewerId = profile?.id || user?.id || "";
  const [person, setPerson] = useState<PeopleCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [plansCreated, setPlansCreated] = useState(0);
  const [plansJoined, setPlansJoined] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!personId) {
      setPerson(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setActionError(null);
      try {
        const card = await getPublicProfileCardAsync(personId, viewerId);
        if (cancelled) return;
        setPerson(card);
        const { created, joined } = await listUserPlansAsync(personId);
        if (cancelled) return;
        setPlansCreated(created.length);
        setPlansJoined(joined.length);
      } catch {
        if (!cancelled) setPerson(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [personId, viewerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <ScreenLoading message="Loading profile…" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className={styles.empty}>
        <h3>Profile not found</h3>
        <p>This member may not be available.</p>
        <div className={styles.emptyActions}>
          <Link
            href="/dashboard/people"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Back to People
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = Boolean(viewerId && person.id === viewerId);

  return (
    <div className={styles.page}>
      <p className={styles.sub}>
        <Link href="/dashboard/people">← People</Link>
      </p>
      <div className={styles.detailBlock}>
        <div className={styles.creatorRow}>
          <span
            className={styles.avatar}
            style={{ width: 56, height: 56, fontSize: 22 }}
          >
            {(person.name[0] || "V").toUpperCase()}
          </span>
          <div>
            <h1 className={styles.title}>{person.name}</h1>
            <p className={styles.sub} style={{ margin: 0 }}>
              {person.city || "City not set"}
              {person.verified ? " · Verified" : ""}
            </p>
          </div>
        </div>
        <p className={styles.sub}>
          {person.bio ||
            "Here for plans, activities and communities — not dating."}
        </p>
        {person.interests.length > 0 ? (
          <div className={styles.interestChips}>
            {person.interests.map((i) => (
              <span key={i} className={styles.chip}>
                {i}
              </span>
            ))}
          </div>
        ) : null}
        <div className={styles.metaRow} style={{ marginTop: 12 }}>
          <span>{plansCreated} plans created</span>
          <span>{plansJoined} plans joined</span>
        </div>
      </div>

      {actionError ? <p className={styles.error}>{actionError}</p> : null}

      <div className={styles.actions}>
        {isSelf ? (
          <Link
            href="/dashboard/profile"
            className={`${styles.btn} ${styles.btnGhost}`}
          >
            Your profile
          </Link>
        ) : person.connectionStatus === "connected" ? (
          <>
            <span className={`${styles.btn} ${styles.btnGhost}`}>
              Connected ✓
            </span>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={async () => {
                if (!viewerId) return;
                const c = await getOrCreateDirectConversation(
                  viewerId,
                  person.id,
                );
                router.push(`/dashboard/chat/${c.id}`);
              }}
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
            Respond in People
          </span>
        ) : (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={async () => {
              if (!viewerId) return;
              setActionError(null);
              const result = await sendConnectRequest(viewerId, person.id);
              if (!result.ok) {
                setActionError(result.error);
                return;
              }
              setPerson(await getPublicProfileCardAsync(personId, viewerId));
            }}
          >
            Connect
          </button>
        )}
        {!isSelf ? (
          <>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
              Report
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
              Block
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
