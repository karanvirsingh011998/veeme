"use client";

import type {
  PersonRatingCounts,
  PersonRatingTier,
} from "@/lib/people/ratings";
import styles from "../social.module.css";

const OPTIONS: {
  tier: PersonRatingTier;
  label: string;
  hint: string;
  mark: string;
}[] = [
  {
    tier: "down",
    label: "Not for me",
    hint: "Show fewer people like this",
    mark: "👎",
  },
  {
    tier: "up",
    label: "I like them",
    hint: "Recommend similar people",
    mark: "👍",
  },
  {
    tier: "love",
    label: "Love this",
    hint: "More people with the same interests and activities",
    mark: "👍👍",
  },
];

const COUNT_LABELS: {
  key: keyof PersonRatingCounts;
  label: string;
  mark: string;
}[] = [
  { key: "down", label: "Not for me", mark: "👎" },
  { key: "up", label: "Likes", mark: "👍" },
  { key: "love", label: "Loved", mark: "👍👍" },
];

export function PersonRatingCountsView({
  counts,
}: {
  counts: PersonRatingCounts;
}) {
  return (
    <div className={styles.ratingCounts} aria-label="Ratings from other people">
      {COUNT_LABELS.map((item) => (
        <span
          key={item.key}
          className={styles.ratingCount}
          tabIndex={0}
          aria-label={`${counts[item.key]} ${item.label}`}
        >
          <span className={styles.ratingMark} aria-hidden="true">
            {item.mark}
          </span>
          <b>{counts[item.key]}</b>
          <span className={styles.ratingCountLabel}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function PersonRating({
  value,
  disabled,
  detailed,
  onChange,
}: {
  value: PersonRatingTier | null;
  disabled?: boolean;
  detailed?: boolean;
  onChange: (tier: PersonRatingTier) => void;
}) {
  return (
    <div className={styles.ratingBlock}>
      {detailed ? (
        <p className={styles.ratingLabel}>How do you feel about them?</p>
      ) : null}
      <div className={styles.ratingRow} role="group" aria-label="Rate this person">
        {OPTIONS.map((option) => {
          const selected = value === option.tier;
          const tone =
            selected && option.tier === "down"
              ? styles.ratingBtnDown
              : selected && option.tier === "love"
                ? styles.ratingBtnLove
                : selected
                  ? styles.ratingBtnActive
                  : "";
          return (
            <button
              key={option.tier}
              type="button"
              className={`${styles.ratingBtn} ${tone}`}
              aria-pressed={selected}
              aria-label={`${option.label}. ${option.hint}`}
              title={option.hint}
              disabled={disabled}
              onClick={() => onChange(option.tier)}
            >
              <span className={styles.ratingMark} aria-hidden="true">
                {option.mark}
              </span>
              <span className={styles.ratingText}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
