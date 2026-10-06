import { TRUST_FEATURES } from "@/lib/constants";
import styles from "./Safety.module.css";

function TrustIcon({ id }: { id: string }) {
  if (id === "verified") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.5 19 6.2v5.4c0 4.3-2.9 7.8-7 9.4-4.1-1.6-7-5.1-7-9.4V6.2L12 3.5z" />
        <path d="m9.2 12.1 1.9 1.9 3.8-3.9" />
      </svg>
    );
  }
  if (id === "ratings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 4.2 2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.1 7.8 17.2l.8-4.7-3.4-3.3 4.7-.7L12 4.2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.5" y="10" width="13" height="10" rx="2.2" />
      <path d="M8.2 10V7.8a3.8 3.8 0 0 1 7.6 0V10" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  );
}

/**
 * Trust strip — verified people, ratings, safety — visually led, not a pill stack.
 */
export function Safety() {
  return (
    <section
      id="safety"
      className={`section ${styles.section}`}
      aria-labelledby="trust-heading"
    >
      <div className="container">
        <div className={styles.panel}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Peace of mind</p>
            <h2 id="trust-heading" className={styles.title}>
              Built around trust
            </h2>
            <p className={styles.lead}>
              Plans work better when people feel safe showing up. Vemee keeps
              that front and center.
            </p>
          </div>

          <ul className={styles.list}>
            {TRUST_FEATURES.map((item, index) => (
              <li
                key={item.id}
                className={styles.item}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span className={styles.icon} aria-hidden="true">
                  <TrustIcon id={item.id} />
                </span>
                <div className={styles.copy}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  <p className={styles.itemText}>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
