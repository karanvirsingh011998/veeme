import { HOW_IT_WORKS } from "@/lib/constants";
import styles from "./HowItWorks.module.css";

/**
 * Three-step how-it-works block from the Veeme Refined mock.
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
          Three steps, one good day.
        </h2>
        <p className="section-copy">
          Vemee starts with what you want to do, not how polished your profile
          looks.
        </p>

        <ol className={styles.steps}>
          {HOW_IT_WORKS.map((step) => (
            <li key={step.step} className={styles.step}>
              <span className={styles.number} aria-hidden="true">
                {step.step}
              </span>
              <p className={styles.copy}>{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
