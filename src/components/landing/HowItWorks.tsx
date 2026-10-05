import { HOW_IT_WORKS } from "@/lib/constants";
import styles from "./HowItWorks.module.css";

/**
 * How Vemee works — vertical cards on mobile, connected four-step row on desktop.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className={`section ${styles.section}`}>
      <div className="container">
        <p className="section-eyebrow">How Vemee works</p>
        <h2 className="section-title">From idea to experience.</h2>
        <p className="section-copy">
          A simple loop: discover, connect, book, and show up with clearer
          context.
        </p>

        <ol className={styles.steps}>
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.step} className={styles.step}>
              <div className={styles.card}>
                <div className={styles.top}>
                  <span className={styles.number}>{step.step}</span>
                  <span className={styles.icon} aria-hidden="true">
                    {step.icon}
                  </span>
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