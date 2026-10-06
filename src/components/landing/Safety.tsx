import { TRUST_FEATURES } from "@/lib/constants";
import styles from "./Safety.module.css";

/**
 * Trust pills — verified people, ratings, safety controls.
 */
export function Safety() {
  return (
    <section
      id="safety"
      className={`section ${styles.section}`}
      aria-labelledby="trust-heading"
    >
      <div className="container">
        <h2 id="trust-heading" className="srOnly">
          Built around trust
        </h2>
        <ul className={styles.list}>
          {TRUST_FEATURES.map((item) => (
            <li key={item.title} className={styles.pill}>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
