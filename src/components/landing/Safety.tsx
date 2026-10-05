import { TRUST_FEATURES } from "@/lib/constants";
import styles from "./Safety.module.css";

/**
 * Trust & safety — reassuring without feeling overly serious.
 */
export function Safety() {
  return (
    <section
      id="safety"
      className={`section ${styles.section}`}
      aria-labelledby="trust-heading"
    >
      <div className="container">
        <p className="section-eyebrow">Trust & safety</p>
        <h2 id="trust-heading" className="section-title">
          Built around trust
        </h2>
        <p className="section-copy">
          Clear signals and community-first controls so connecting around plans
          feels more comfortable.
        </p>

        <ul className={styles.grid}>
          {TRUST_FEATURES.map((item) => (
            <li key={item.title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <h3 className={styles.title}>{item.title}</h3>
              <p className={styles.copy}>{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
