import { PEOPLE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import styles from "./PeoplePreview.module.css";

/**
 * People preview — horizontal carousel (~2.2 cards) on mobile;
 * wide card row with View profile CTAs on desktop.
 */
export function PeoplePreview() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.head}>
          <div>
            <p className="section-eyebrow">People</p>
            <h2 className="section-title">Find someone who fits the plan.</h2>
            <p className="section-copy">
              Browse verified profiles with clear interests, ratings and context
              before you connect.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.carouselWrap}>
        <div className={`hide-scrollbar ${styles.carousel}`}>
          {PEOPLE.map((person) => (
            <article key={person.name} className={styles.card}>
              <div className={styles.avatar} aria-hidden="true">
                {person.avatar}
              </div>
              <div className={styles.body}>
                <div className={styles.nameRow}>
                  <h3>{person.name}</h3>
                  {person.verified ? (
                    <span className="tag">✓ Verified</span>
                  ) : null}
                </div>
                <p className={styles.role}>{person.role}</p>
                <p className={styles.rating}>★ {person.rating}</p>
                <p className={styles.interest}>{person.interest}</p>
                <Button
                  href="/signup"
                  variant="secondary"
                  className={styles.cta}
                >
                  View profile
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}