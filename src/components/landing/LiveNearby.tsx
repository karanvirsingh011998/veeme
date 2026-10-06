"use client";

import Link from "next/link";
import { LIVE_PLANS } from "@/lib/constants";
import styles from "./LiveNearby.module.css";

/**
 * Auto-scrolling live-plans strip (paused on hover / reduced motion).
 */
export function LiveNearby() {
  const loop = [...LIVE_PLANS, ...LIVE_PLANS];

  return (
    <section
      id="nearby"
      className={`section ${styles.section}`}
      aria-labelledby="nearby-heading"
    >
      <div className="container">
        <h2 id="nearby-heading" className={styles.title}>
          Live nearby plans
        </h2>
      </div>

      <div className={styles.viewport} aria-label="Live nearby plans carousel">
        <div className={styles.track}>
          {loop.map((plan, index) => (
            <Link
              key={`${plan.title}-${index}`}
              href="/signup"
              className={styles.card}
              tabIndex={index >= LIVE_PLANS.length ? -1 : undefined}
              aria-hidden={index >= LIVE_PLANS.length ? true : undefined}
            >
              <span className={styles.category}>{plan.category}</span>
              <strong className={styles.cardTitle}>{plan.title}</strong>
              <span className={styles.meta}>{plan.meta}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
