"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectOwnedCommunities,
  selectOwnedCommunitiesStatus,
} from "@/store/selectors/sharedSelectors";
import { fetchOwnedCommunities } from "@/store/slices/communitiesSlice";
import styles from "./community.module.css";

type CommunityPickerProps = {
  userId: string;
  value: string;
  onChange: (communityId: string) => void;
};

/**
 * Communities the signed-in member created. Required before a community post.
 */
export function CommunityPicker({ userId, value, onChange }: CommunityPickerProps) {
  const dispatch = useAppDispatch();
  const owned = useAppSelector(selectOwnedCommunities);
  const status = useAppSelector(selectOwnedCommunitiesStatus);

  useEffect(() => {
    if (!userId) return;
    void dispatch(fetchOwnedCommunities({ userId }));
  }, [dispatch, userId]);

  if ((status === "idle" || status === "loading") && owned.length === 0) {
    return <p className={styles.note}>Loading your communities…</p>;
  }

  if (owned.length === 0) {
    return (
      <p className={styles.note}>
        Create a community first, then you can post to it.{" "}
        <Link href="/dashboard/community">Open the community tab</Link>
      </p>
    );
  }

  return (
    <label className={styles.field}>
      Your community
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Choose a community</option>
        {owned.map((community) => (
          <option key={community.id} value={community.id}>
            {community.icon} {community.name}
          </option>
        ))}
      </select>
    </label>
  );
}
