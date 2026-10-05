import { CATEGORIES } from "@/lib/constants";
import styles from "./Categories.module.css";

/**
 * Activity discovery — interactive category cards linking into signup.
 */
export function Categories() {
  return (
    <section
      id="discover"
      className={`section ${styles.section}`}
      aria-labelledby="activities-heading"
    >
      <div id="activities" className="container">
        <p className="section-eyebrow">Activity discovery</p>
        <h2 id="activities-heading" className="section-title">
          What are you looking to do?
        </h2>
        <p className="section-copy">
          Choose an activity. Find people who want to do the same.
        </p>

        <div className={styles.grid}>
          {CATEGORIES.map((cat) => (
            <a key={cat.label} href="/signup" className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                {cat.icon}
              </span>
              <span className={styles.label}>{cat.label}</span>
              <span className={styles.description}>{cat.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
