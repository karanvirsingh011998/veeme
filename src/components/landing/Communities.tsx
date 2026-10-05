import { COMMUNITIES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import styles from "./Communities.module.css";

/**
 * Communities — stacked cards on mobile; split copy + grid on desktop.
 */
export function Communities() {
  return (
    <section id="communities" className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className="section-eyebrow">Communities</p>
          <h2 className="section-title">
            Find communities that feel like you.
          </h2>
          <p className="section-copy">
            Join interest groups, local meetups and shared activities — then
            turn posts into real plans.
          </p>
          <Button
            href="/signup"
            variant="primary"
            className={styles.cta}
          >
            Explore communities
          </Button>
        </div>

        <div className={styles.cards}>
          {COMMUNITIES.map((community) => (
            <a
              key={community.name}
              href="/signup"
              className={styles.card}
            >
              <span className={styles.icon} aria-hidden="true">
                {community.icon}
              </span>
              <span className={styles.meta}>
                <strong>{community.name}</strong>
                <span>{community.members} · Shared interests</span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ›
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}