import { HOW_IT_WORKS } from "@/lib/constants";
import styles from "./HowItWorks.module.css";

/**
 * How Vemee works — four-step plan-to-people journey.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className={`section ${styles.section}`}
      aria-labelledby="how-heading"
    >
      <div className="container">
        <p className="section-eyebrow">How it works</p>
        <h2 id="how-heading" className="section-title">
          From plan to people — in four steps.
        </h2>
        <p className="section-copy">
          A simple loop built around shared activities, not endless profiles.
        </p>

        <ol className={styles.steps}>
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.step} className={styles.step}>
              <div className={styles.card}>
                <div className={styles.top}>
                  <span className={styles.number}>{step.step}</span>
                </div>
                <h3 className={styles.title}>{step.title}</h3>
                <p className={styles.copy}>{step.description}</p>
              </div>
              {index < HOW_IT_WORKS.length - 1 ? (
                <span className={styles.connector} aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
