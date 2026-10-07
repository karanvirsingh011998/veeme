"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readAuthSession } from "@/lib/auth/session";
import {
  DEFAULT_MEMBERSHIP_PLANS,
  formatMembershipPrice,
  type MembershipKey,
  type MembershipPlan,
} from "@/lib/membership/catalog";
import styles from "./membership.module.css";

export function MembershipScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>(DEFAULT_MEMBERSHIP_PLANS);
  const [currentKey, setCurrentKey] = useState<MembershipKey>("free");
  const [userId, setUserId] = useState("");
  const [busyKey, setBusyKey] = useState<MembershipKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = readAuthSession();
    const id = session?.id || "";
    setUserId(id);
    const query = id ? `?userId=${encodeURIComponent(id)}` : "";
    void fetch(`/api/membership${query}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { plans?: MembershipPlan[]; membershipKey?: MembershipKey }) => {
        if (data.plans?.length) setPlans(data.plans);
        if (data.membershipKey) setCurrentKey(data.membershipKey);
      })
      .catch(() => undefined);
  }, []);

  async function onUpgrade(plan: MembershipPlan) {
    setMessage(null);
    if (!userId) {
      router.push("/login");
      return;
    }
    setBusyKey(plan.key);
    const res = await fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planKey: plan.key }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      membershipKey?: MembershipKey;
    };
    setBusyKey(null);
    if (!res.ok || !data.membershipKey) {
      setMessage(data.error || "Couldn't change your plan.");
      return;
    }
    setCurrentKey(data.membershipKey);
    setMessage(`You're on ${plan.name}.`);
  }

  return (
    <div className={styles.page}>
      <header className={`container ${styles.header}`}>
        <Link href="/" className={styles.logo}>
          Vemee
        </Link>
        <Link href={userId ? "/dashboard" : "/login"} className="btn btn-ghost">
          {userId ? "Dashboard" : "Log in"}
        </Link>
      </header>
      <main className={`container ${styles.main}`}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Membership</p>
          <h1>Plans you can move up to</h1>
          <p>
            Every new account starts on Free. Upgrade whenever you want. Payment
            is not collected yet.
          </p>
        </div>
        <div className={styles.grid}>
          {plans.map((plan) => {
            const current = Boolean(userId) && plan.key === currentKey;
            return (
              <article
                key={plan.key}
                className={`${styles.card} ${current ? styles.cardCurrent : ""}`}
              >
                <div>
                  <h2>{plan.name}</h2>
                  <p className={styles.tagline}>{plan.features.tagline}</p>
                </div>
                <p className={styles.price}>
                  {formatMembershipPrice(plan.pricePaise)}
                  {plan.pricePaise > 0 ? <span> / month</span> : null}
                </p>
                <ul className={styles.highlights}>
                  {plan.features.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {current || plan.key === "free" ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled
                    aria-current={current ? "true" : undefined}
                  >
                    {current ? "Current plan" : "Included"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyKey === plan.key}
                    onClick={() => void onUpgrade(plan)}
                  >
                    {busyKey === plan.key ? "Upgrading…" : "Upgrade"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <p className={styles.status} role="status">
          {message}
        </p>
        <p className={styles.note}>
          Prices and details are stored with each plan and can be changed later.
        </p>
      </main>
    </div>
  );
}
