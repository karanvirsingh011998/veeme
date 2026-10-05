import { CATEGORIES } from "@/lib/constants";
import styles from "./Categories.module.css";

/**
 * Category discovery grid — 2 columns on mobile, wider premium grid on desktop.
 */
export function Categories() {
  return (
    <section id="discover" className={`section ${styles.section}`}>
      <div className="container">
        <p className="section-eyebrow">Discover</p>
        <h2 className="section-title">What are you looking for?</h2>
        <p className="section-copy">
          Start with a category — then find people, experiences and communities
          that fit the plan.
        </p>

        <div className={styles.grid}>
          {CATEGORIES.map((cat) => (
            <a key={cat.label} href="/signup" className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                {cat.icon}
              </span>
              <span className={styles.label}>{cat.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}