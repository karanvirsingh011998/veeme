import { TRUST_ITEMS } from "@/lib/constants";
import styles from "./Safety.module.css";

/**
 * Trust & safety — soft sage band; stacked on mobile, two-column on desktop.
 */
export function Safety() {
  return (
    <section id="safety" className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="section-eyebrow">Safety / Trust</p>
          <h2 className={`section-title ${styles.titleMobile}`}>
            Built for real-world connections.
          </h2>
          <h2 className={`section-title ${styles.titleDesktop}`}>
            Real people.
            <br />
            Clear signals.
            <br />
            Better plans.
          </h2>
          <p className="section-copy">
            Verification increases trust — it doesn&apos;t promise perfect
            safety. Clear badges, reporting tools and check-ins help you decide
            with more context.
          </p>
        </div>

        <ul className={styles.list}>
          {TRUST_ITEMS.map((item) => (
            <li key={item} className={styles.item}>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}