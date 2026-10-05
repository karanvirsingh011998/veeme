import { PLAN_EXAMPLES } from "@/lib/constants";
import styles from "./PlansDifferentiator.module.css";

/**
 * Core differentiator — Vemee is about plans, not profiles.
 */
export function PlansDifferentiator() {
  return (
    <section
      id="about"
      className={`section ${styles.section}`}
      aria-labelledby="plans-heading"
    >
      <div className="container">
        <p className="section-eyebrow">Why Vemee</p>
        <h2 id="plans-heading" className="section-title">
          Vemee is about plans, not profiles.
        </h2>
        <p className={`section-copy ${styles.copy}`}>
          Instead of endlessly scrolling through people, start with what you
          want to do.
        </p>

        <ul className={styles.list}>
          {PLAN_EXAMPLES.map((example) => (
            <li
              key={example.plan}
              className={`${styles.card} ${styles[example.accent]}`}
            >
              <p className={styles.plan}>{example.plan}</p>
              <p className={styles.outcome}>
                <span aria-hidden="true">→</span> {example.outcome}
              </p>
            </li>
          ))}
        </ul>

        <p className={styles.close}>
          You bring the plan. Vemee helps you find your people.
        </p>
      </div>
    </section>
  );
}
