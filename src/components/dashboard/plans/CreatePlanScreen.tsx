"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { NotificationBell } from "@/components/dashboard/notifications/NotificationBell";
import { createCommunity } from "@/lib/communities/service";
import { COMMUNITY_ICONS } from "@/lib/communities/types";
import { createMoment } from "@/lib/moments/service";
import { readApproxLocation } from "@/lib/location/geo";
import { createPlan } from "@/lib/plans/service";
import type { PeopleNeeded, PlanCategoryId, PlanVisibility } from "@/lib/plans/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectOwnedCommunities } from "@/store/selectors/sharedSelectors";
import { communityCreated, fetchOwnedCommunities } from "@/store/slices/communitiesSlice";
import styles from "../home.module.css";

type CreateMode = "plan" | "community" | "post";
type PostKind = "moment" | "question" | "recommendation" | "community" | "plan";

const PLAN_CATEGORIES: { id: PlanCategoryId; label: string }[] = [
  { id: "food", label: "Coffee" },
  { id: "fitness", label: "Fitness" },
  { id: "outdoor", label: "Outdoor" },
  { id: "events", label: "Art" },
  { id: "study", label: "Learning" },
  { id: "other", label: "Other" },
];

const COMMUNITY_CATEGORIES: { label: string; icon: (typeof COMMUNITY_ICONS)[number] }[] = [
  { label: "Outdoor", icon: "🌿" },
  { label: "Food", icon: "🍜" },
  { label: "Fitness", icon: "🏋️" },
  { label: "Art", icon: "🎨" },
  { label: "Learning", icon: "👥" },
  { label: "Coffee", icon: "☕" },
  { label: "Other", icon: "👥" },
];

const POST_HINTS: Record<PostKind, string> = {
  moment: "Share an update from an activity. Keep it friendly and avoid personal information.",
  question: "Ask something useful. Stay kind and specific.",
  recommendation: "Recommend a place or activity people nearby can try.",
  community: "Share a note with people in your communities.",
  plan: "Invite people to a plan. Keep the details clear.",
};

/**
 * Create — plan, community, or post, in the mobile form layout.
 */
export function CreatePlanScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = profile?.id || user?.id || "";
  const authorName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.firstName ||
    "You";
  const loc = useMemo(() => readApproxLocation(), []);
  const owned = useAppSelector(selectOwnedCommunities);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [mode, setMode] = useState<CreateMode>("plan");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [organized, setOrganized] = useState<PlanVisibility>("public");
  const [category, setCategory] = useState<PlanCategoryId>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationLabel, setLocationLabel] = useState(
    loc?.area && loc?.city ? `${loc.area}, ${loc.city}` : loc?.city || "",
  );
  const [attendees, setAttendees] = useState(6);
  const [price, setPrice] = useState(0);
  const [communityId, setCommunityId] = useState("");

  const [communityName, setCommunityName] = useState("");
  const [communityCategory, setCommunityCategory] = useState(COMMUNITY_CATEGORIES[0]!.label);
  const [communityAbout, setCommunityAbout] = useState("");
  const [communityArea, setCommunityArea] = useState(loc?.city || "");
  const [communityRules, setCommunityRules] = useState("");

  const [postKind, setPostKind] = useState<PostKind>("moment");
  const [postBody, setPostBody] = useState("");
  const [postAudience, setPostAudience] = useState<"everyone" | "communities">("everyone");
  const [postCommunityId, setPostCommunityId] = useState("");

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchOwnedCommunities({ userId }));
  }, [dispatch, userId]);

  function switchMode(next: CreateMode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  async function onPlan(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    if (organized === "community" && !communityId) {
      setError("Choose one of your communities.");
      return;
    }
    const peopleNeeded = Math.min(5, Math.max(1, attendees - 1)) as PeopleNeeded;
    setBusy(true);
    setError(null);
    const result = await createPlan({
      creatorId: userId,
      category,
      title,
      description,
      date,
      time,
      locationLabel,
      city: loc?.city || undefined,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      peopleNeeded,
      visibility: organized,
      communityId: organized === "community" ? communityId : null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(result.plan.id);
  }

  async function onCommunity(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    const icon =
      COMMUNITY_CATEGORIES.find((item) => item.label === communityCategory)?.icon || "👥";
    let about = communityAbout.trim();
    if (communityArea.trim()) about = `${communityArea.trim()} · ${about}`;
    if (communityRules.trim()) about = `${about}\n${communityRules.trim()}`;
    if (about.length > 300) {
      setError("Keep the description, area, and rules under 300 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createCommunity({
      creatorId: userId,
      name: communityName,
      description: about,
      icon,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    dispatch(communityCreated(result.community));
    setSuccess("community");
  }

  async function onPost(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    if (postAudience === "communities" && !postCommunityId) {
      setError("Choose one of your communities.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createMoment({
      authorId: userId,
      authorName,
      audience: postAudience === "communities" ? "community" : "individual",
      communityId: postAudience === "communities" ? postCommunityId : null,
      body: postBody,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("post");
  }

  return (
    <div className={styles.flow}>
      <header className={styles.pageHead}>
        <div>
          <h1>Create</h1>
          <p>Create a plan, start a community, or share a post.</p>
        </div>
        <NotificationBell />
      </header>

      <div className={styles.modes} role="tablist" aria-label="What to create">
        {(
          [
            ["plan", "Plan"],
            ["community", "Community"],
            ["post", "Post"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={mode === id ? styles.modeOn : undefined}
            onClick={() => switchMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {success === "community" ? (
        <div className={styles.formCard}>
          <h2 className={styles.groupLabel}>Community created</h2>
          <p className={styles.quiet}>People can find it from the Communities tab.</p>
          <Link href="/dashboard/community" className={styles.submit}>
            View communities
          </Link>
        </div>
      ) : success === "post" ? (
        <div className={styles.formCard}>
          <h2 className={styles.groupLabel}>Post published</h2>
          <p className={styles.quiet}>Your update is on Moments.</p>
          <Link href="/dashboard/moments" className={styles.submit}>
            View moments
          </Link>
        </div>
      ) : success ? (
        <div className={styles.formCard}>
          <h2 className={styles.groupLabel}>Your plan is live</h2>
          <p className={styles.quiet}>People interested in this activity can discover it.</p>
          <Link href={`/dashboard/plans/${success}`} className={styles.submit}>
            View plan
          </Link>
        </div>
      ) : mode === "community" ? (
        <form className={styles.formCard} onSubmit={(event) => void onCommunity(event)}>
          <label className={styles.field}>
            <span>Community name *</span>
            <input
              required
              minLength={4}
              maxLength={70}
              placeholder="e.g. Delhi Board Game Circle"
              value={communityName}
              onChange={(event) => setCommunityName(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Category *</span>
            <select
              value={communityCategory}
              onChange={(event) => setCommunityCategory(event.target.value)}
            >
              {COMMUNITY_CATEGORIES.map((item) => (
                <option key={item.label}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>What is this community about? *</span>
            <textarea
              required
              minLength={15}
              maxLength={300}
              value={communityAbout}
              onChange={(event) => setCommunityAbout(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Area *</span>
            <input
              required
              placeholder="Delhi NCR"
              value={communityArea}
              onChange={(event) => setCommunityArea(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Community rules</span>
            <textarea
              placeholder="Be respectful, RSVP before attending..."
              value={communityRules}
              onChange={(event) => setCommunityRules(event.target.value)}
            />
          </label>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create community"}
          </button>
        </form>
      ) : mode === "post" ? (
        <form className={styles.formCard} onSubmit={(event) => void onPost(event)}>
          <label className={styles.field}>
            <span>Post category *</span>
            <select
              value={postKind}
              onChange={(event) => setPostKind(event.target.value as PostKind)}
            >
              <option value="moment">Moment / update</option>
              <option value="question">Question</option>
              <option value="recommendation">Recommendation</option>
              <option value="community">Community announcement</option>
              <option value="plan">Plan invitation</option>
            </select>
          </label>
          <p className={styles.rules}>{POST_HINTS[postKind]}</p>
          <label className={styles.field}>
            <span>Your post *</span>
            <textarea
              required
              minLength={4}
              maxLength={300}
              value={postBody}
              onChange={(event) => setPostBody(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Audience</span>
            <select
              value={postAudience}
              onChange={(event) =>
                setPostAudience(event.target.value as "everyone" | "communities")
              }
            >
              <option value="everyone">Everyone</option>
              <option value="communities">My communities</option>
            </select>
          </label>
          {postAudience === "communities" ? (
            <label className={styles.field}>
              <span>Community *</span>
              <select
                required
                value={postCommunityId}
                onChange={(event) => setPostCommunityId(event.target.value)}
              >
                <option value="">Choose a community</option>
                {owned.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.icon} {community.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={busy}>
            {busy ? "Publishing…" : "Publish post"}
          </button>
        </form>
      ) : (
        <form className={styles.formCard} onSubmit={(event) => void onPlan(event)}>
          <label className={styles.field}>
            <span>What&apos;s the plan? *</span>
            <input
              required
              maxLength={90}
              placeholder="e.g. Saturday evening badminton"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Organized by *</span>
              <select
                value={organized}
                onChange={(event) => {
                  const next = event.target.value as PlanVisibility;
                  setOrganized(next);
                  if (next !== "community") setCommunityId("");
                }}
              >
                <option value="public">An individual</option>
                <option value="community">A community</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Category *</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as PlanCategoryId)}
              >
                {PLAN_CATEGORIES.map((item) => (
                  <option key={item.label} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {organized === "community" ? (
            <label className={styles.field}>
              <span>Which community? *</span>
              <select
                required
                value={communityId}
                onChange={(event) => setCommunityId(event.target.value)}
              >
                <option value="">Choose a community</option>
                {owned.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.icon} {community.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className={styles.field}>
            <span>Tell people what to expect *</span>
            <textarea
              required
              maxLength={550}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Date *</span>
              <input
                type="date"
                required
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Start time *</span>
              <input
                type="time"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
          </div>
          <label className={styles.field}>
            <span>Meeting area *</span>
            <input
              required
              maxLength={100}
              placeholder="e.g. Dwarka Sector 12"
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
            />
          </label>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Total attendees *</span>
              <input
                type="number"
                required
                min={2}
                max={6}
                value={attendees}
                onChange={(event) => setAttendees(Number(event.target.value))}
              />
            </label>
            <label className={styles.field}>
              <span>Expected ₹/person *</span>
              <input
                type="number"
                required
                min={0}
                max={100000}
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
              />
            </label>
          </div>
          <p className={styles.quiet}>
            Individual = hosted by a person. Community = organized by a group.
          </p>
          {error ? <p className={styles.formError}>{error}</p> : null}
          <button className={styles.submit} type="submit" disabled={busy}>
            <PlusIcon />
            {busy ? "Publishing…" : "Publish plan"}
          </button>
        </form>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
