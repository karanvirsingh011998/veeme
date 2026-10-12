"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { COMMUNITY_LIST } from "@/lib/dashboard/demo-data";
import { createCommunity } from "@/lib/communities/service";
import { COMMUNITY_ICONS } from "@/lib/communities/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectOwnedCommunities,
  selectOwnedCommunitiesStatus,
} from "@/store/selectors/sharedSelectors";
import {
  communityCreated,
  fetchOwnedCommunities,
} from "@/store/slices/communitiesSlice";
import styles from "./community/community.module.css";

const TABS = ["For You", "My Communities", "Events"] as const;

/**
 * Community directory. Suggestions stay in For You.
 * My Communities lists only groups this member created.
 */
export function CommunityScreen() {
  const dispatch = useAppDispatch();
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || "";
  const owned = useAppSelector(selectOwnedCommunities);
  const ownedStatus = useAppSelector(selectOwnedCommunitiesStatus);
  const [tab, setTab] = useState<(typeof TABS)[number]>("For You");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<(typeof COMMUNITY_ICONS)[number]>("👥");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchOwnedCommunities({ userId }));
  }, [dispatch, userId]);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("Sign in to create a community.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createCommunity({
      creatorId: userId,
      name,
      description,
      icon,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    dispatch(communityCreated(result.community));
    setName("");
    setDescription("");
    setIcon("👥");
    setCreating(false);
    setTab("My Communities");
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Community</h1>
        <button
          type="button"
          className={styles.add}
          aria-label="Create community"
          aria-expanded={creating}
          onClick={() => setCreating((open) => !open)}
        >
          ＋
        </button>
      </header>

      {creating ? (
        <form className={styles.form} onSubmit={(event) => void onCreate(event)}>
          <h2>New community</h2>
          <label className={styles.field}>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              placeholder="Weekend walkers"
            />
          </label>
          <label className={styles.field}>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="What this community is for"
            />
          </label>
          <div className={styles.field}>
            Icon
            <div className={styles.icons}>
              {COMMUNITY_ICONS.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={choice === icon ? styles.iconChoiceActive : styles.iconChoice}
                  aria-label={choice}
                  aria-pressed={choice === icon}
                  onClick={() => setIcon(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button type="submit" className={styles.submit} disabled={busy}>
            {busy ? "Creating…" : "Create community"}
          </button>
        </form>
      ) : null}

      <div className={styles.chips}>
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? styles.chipActive : styles.chip}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Events" ? (
        <div className={styles.empty}>
          <h3>Upcoming community events</h3>
          <p>No events yet — join a community to see local meetups here.</p>
        </div>
      ) : null}

      {tab === "For You" ? (
        <div className={styles.list}>
          <p className={styles.hint}>Suggestions to explore. They are not yours to post in.</p>
          {COMMUNITY_LIST.map((community) => (
            <div key={community.name} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                {community.icon}
              </span>
              <span>
                <h3>{community.name}</h3>
                <p>{community.members} · Shared interests</p>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "My Communities" ? (
        <div className={styles.list}>
          {ownedStatus === "loading" && owned.length === 0 ? (
            <p className={styles.hint}>Loading your communities…</p>
          ) : owned.length === 0 ? (
            <div className={styles.empty}>
              <h3>No communities yet</h3>
              <p>Use the plus button to create one. It will show up when you post.</p>
            </div>
          ) : (
            owned.map((community) => (
              <div key={community.id} className={styles.card}>
                <span className={styles.icon} aria-hidden="true">
                  {community.icon}
                </span>
                <span>
                  <h3>{community.name}</h3>
                  <p>
                    {community.memberCount}{" "}
                    {community.memberCount === 1 ? "member" : "members"}
                    {community.description ? ` · ${community.description}` : ""}
                  </p>
                </span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
