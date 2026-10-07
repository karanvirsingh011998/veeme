"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { MANUAL_CITIES } from "@/lib/location/geo";
import { updateProfile } from "@/lib/profile/service";
import { ScreenLoading } from "@/components/dashboard/ui/ScreenLoading";
import {
  EMPTY_RATING_COUNTS,
  getPersonRatingCounts,
  type PersonRatingCounts,
} from "@/lib/people/ratings";
import { PersonRatingCountsView } from "@/components/dashboard/people/PersonRating";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { commitApproxLocation } from "@/store/slices/locationSlice";
import { fetchProfileStats, profileLoaded } from "@/store/slices/userSlice";
import styles from "./ProfileScreen.module.css";

/**
 * Own profile — polished activity-focused layout.
 */
export function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const userId = profile?.id || user?.id || "";
  const firstName = profile?.first_name || user?.firstName || "";
  const lastName = profile?.last_name || user?.lastName || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Vemee member";
  const initial = (displayName[0] || "V").toUpperCase();

  const dispatch = useAppDispatch();
  const createdCount = useAppSelector((state) => state.user.createdCount);
  const joinedCount = useAppSelector((state) => state.user.joinedCount);
  const connectionCount = useAppSelector((state) => state.user.connectionCount);
  const statsStatus = useAppSelector((state) => state.user.statsStatus);
  const locationCity = useAppSelector((state) => state.location.city);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ratingCounts, setRatingCounts] =
    useState<PersonRatingCounts>(EMPTY_RATING_COUNTS);
  const loadingStats = statsStatus === "idle" || statsStatus === "loading";

  useEffect(() => {
    setBio(profile?.bio || "");
    setCity(profile?.city || locationCity || "");
  }, [locationCity, profile?.bio, profile?.city]);

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchProfileStats(userId));
    let cancelled = false;
    void getPersonRatingCounts(userId).then((counts) => {
      if (!cancelled) setRatingCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, userId]);

  async function saveBasics() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    const result = await updateProfile(userId, { bio, city });
    const match = MANUAL_CITIES.find((c) => c.city === city);
    if (match) {
      dispatch(
        commitApproxLocation({
          lat: match.lat,
          lng: match.lng,
          city: match.city,
          area: match.area,
          source: "manual",
          updatedAt: new Date().toISOString(),
        }),
      );
    }
    if (result.ok) {
      dispatch(profileLoaded(result.profile));
      setSaved(true);
      setEditing(false);
    }
    setSaving(false);
  }

  const cityLabel =
    MANUAL_CITIES.find((c) => c.city === city)?.area && city
      ? `${city}`
      : city;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Profile</h1>
        <button
          type="button"
          className={styles.editToggle}
          onClick={() => {
            setEditing((v) => !v);
            setSaved(false);
          }}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </header>

      <section className={styles.hero}>
        <div className={styles.avatar} aria-hidden="true">
          {initial}
        </div>
        <h2 className={styles.name}>{displayName}</h2>
        <p className={styles.location}>
          {cityLabel ? (
            <>
              <span aria-hidden="true">📍</span> {cityLabel}
            </>
          ) : (
            "Add your city to discover nearby plans"
          )}
        </p>
        {profile?.phone_verified_at ? (
          <span className={styles.badge}>Verified member</span>
        ) : (
          <span className={styles.badgeMuted}>Phone account</span>
        )}
        {bio && !editing ? (
          <p className={styles.bioPreview}>{bio}</p>
        ) : null}
      </section>

      {loadingStats ? (
        <ScreenLoading message="Loading your activity…" inline />
      ) : (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{connectionCount}</strong>
            <span>Connections</span>
          </div>
          <div className={styles.stat}>
            <strong>{createdCount}</strong>
            <span>Created</span>
          </div>
          <div className={styles.stat}>
            <strong>{joinedCount}</strong>
            <span>Joined</span>
          </div>
        </div>
      )}

      <div className={styles.ratingTotals}>
        <PersonRatingCountsView counts={ratingCounts} />
      </div>

      {editing ? (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>About you</h3>
          <p className={styles.cardHint}>
            Keep it about plans and activities — not dating.
          </p>

          <label className={styles.field}>
            <span>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What kinds of plans are you into?"
              rows={3}
            />
          </label>

          <label className={styles.field}>
            <span>City / area</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Select city</option>
              {MANUAL_CITIES.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} — {c.area}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void saveBasics()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved ? <p className={styles.saved}>Profile updated</p> : null}
        </section>
      ) : null}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Quick actions</h3>
        <nav className={styles.menu} aria-label="Profile actions">
          <Link href="/dashboard/plans/new" className={styles.menuItem}>
            <span className={styles.menuIcon} aria-hidden="true">
              ＋
            </span>
            <span className={styles.menuText}>
              <strong>Create a Plan</strong>
              <small>Post what you want to do</small>
            </span>
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
          <Link href="/dashboard/explore" className={styles.menuItem}>
            <span className={styles.menuIcon} aria-hidden="true">
              ⌕
            </span>
            <span className={styles.menuText}>
              <strong>Explore Plans</strong>
              <small>Find activities near you</small>
            </span>
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
          <Link href="/dashboard/people" className={styles.menuItem}>
            <span className={styles.menuIcon} aria-hidden="true">
              ◎
            </span>
            <span className={styles.menuText}>
              <strong>People</strong>
              <small>Connect around shared plans</small>
            </span>
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
          {!editing ? (
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => setEditing(true)}
            >
              <span className={styles.menuIcon} aria-hidden="true">
                ✎
              </span>
              <span className={styles.menuText}>
                <strong>Edit profile</strong>
                <small>Bio, city and preferences</small>
              </span>
              <span className={styles.chevron} aria-hidden="true">
                ›
              </span>
            </button>
          ) : null}
        </nav>
      </section>

      <button
        type="button"
        className={styles.logout}
        onClick={() => void logout()}
      >
        Log out
      </button>
    </div>
  );
}
