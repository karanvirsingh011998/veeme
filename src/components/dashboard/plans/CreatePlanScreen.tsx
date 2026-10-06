"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/AuthProvider";
import { PLAN_CATEGORIES, type PeopleNeeded, type PlanCategoryId, type PlanVisibility } from "@/lib/plans/types";
import { createPlan } from "@/lib/plans/service";
import { readApproxLocation } from "@/lib/location/geo";
import styles from "../social.module.css";

/**
 * Create / Post a Plan form with success state.
 */
export function CreatePlanScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const userId = profile?.id || user?.id || "";
  const loc = useMemo(() => readApproxLocation(), []);

  const [category, setCategory] = useState<PlanCategoryId>("outdoor");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationLabel, setLocationLabel] = useState(
    loc?.area && loc?.city ? `${loc.area}, ${loc.city}` : loc?.city || "",
  );
  const [peopleNeeded, setPeopleNeeded] = useState<PeopleNeeded>(3);
  const [visibility, setVisibility] = useState<PlanVisibility>("public");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Sign in to post a plan.");
      return;
    }
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
      visibility,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccessId(result.plan.id);
  }

  if (successId) {
    return (
      <div className={styles.page}>
        <div className={styles.success}>
          <h2>Your plan is live!</h2>
          <p>
            People interested in this activity can now discover your plan.
          </p>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => router.push(`/dashboard/plans/${successId}`)}
            >
              View plan
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={() => router.push("/dashboard/explore")}
            >
              Explore plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Create a Plan</h1>
          <p className={styles.sub}>
            Tell others what you want to do and find people to join.
          </p>
        </div>
      </div>

      <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
        <label className={styles.label}>
          Activity
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value as PlanCategoryId)}
          >
            {PLAN_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Plan title
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekend Cricket Match"
            required
          />
        </label>

        <label className={styles.label}>
          Description
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Looking for 3 more players for a friendly cricket match this Saturday evening."
            required
          />
        </label>

        <div className={styles.row2}>
          <label className={styles.label}>
            Date
            <input
              className={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Time
            <input
              className={styles.input}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>
        </div>

        <label className={styles.label}>
          Location
          <input
            className={styles.input}
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="Sector 17, Chandigarh"
            required
          />
        </label>

        <div className={styles.row2}>
          <label className={styles.label}>
            People needed
            <select
              className={styles.select}
              value={peopleNeeded}
              onChange={(e) =>
                setPeopleNeeded(Number(e.target.value) as PeopleNeeded)
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5+</option>
            </select>
          </label>
          <label className={styles.label}>
            Visibility
            <select
              className={styles.select}
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as PlanVisibility)
              }
            >
              <option value="public">Public</option>
              <option value="community">Community</option>
            </select>
          </label>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy}
          style={{ minHeight: 48 }}
        >
          {busy ? "Posting…" : "Post Plan"}
        </button>
      </form>
    </div>
  );
}
