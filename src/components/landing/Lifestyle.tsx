import { LIFESTYLE_TILES } from "@/lib/constants";
import styles from "./Lifestyle.module.css";

/**
 * Lifestyle collage — countless ways to connect around shared activities.
 */
export function Lifestyle() {
  return (
    <section
      id="communities"
      className={`section ${styles.section}`}
      aria-labelledby="lifestyle-heading"
    >
      <div className="container">
        <p className="section-eyebrow">Lifestyle</p>
        <h2 id="lifestyle-heading" className="section-title">
          One app. Countless ways to connect.
        </h2>
        <p className="section-copy">
          Travel. Fitness. Gaming. Food. Movies. Study. Sports. Events.
          Communities.
        </p>
        <p className={styles.lead}>
          Whatever you’re planning, there’s probably someone looking for the
          same thing.
        </p>

        <div className={styles.collage} aria-hidden="true">
          {LIFESTYLE_TILES.map((tile) => (
            <div
              key={tile.label}
              className={`${styles.tile} ${styles[tile.tone]}`}
            >
              <span>{tile.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
