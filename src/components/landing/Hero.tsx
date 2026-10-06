import { Button } from "@/components/ui/Button";
import styles from "./Hero.module.css";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80";

/**
 * Veeme Refined hero — badge, headline, peach CTA, featured plan photo.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.badge}>
            <span className={styles.dot} aria-hidden="true" />
            Plans are happening near you today
          </p>
          <h1 id="hero-heading" className={styles.title}>
            Find your people.
            <br />
            Do more together.
          </h1>
          <p className={styles.subtitle}>
            Someone&apos;s already holding a spot. See what&apos;s happening
            near you and roll in — no awkward firsts, just good company.
          </p>
          <Button href="/signup" variant="primary" className={styles.cta}>
            See plans near me <span aria-hidden="true">→</span>
          </Button>
          <p className={styles.micro}>Free to join · Built around real plans</p>
        </div>

        <a href="/signup" className={styles.featured} aria-label="Rooftop board-game night">
          <div className={styles.photoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt="Friends laughing together at a golden-hour gathering"
              className={styles.photo}
            />
          </div>
          <div className={styles.planCard}>
            <h2 className={styles.planTitle}>Rooftop board-game night</h2>
            <p className={styles.planMeta}>
              <span className={styles.pin} aria-hidden="true">
                📍
              </span>
              12 min away
            </p>
            <p className={styles.planDetail}>
              8 going · tonight, 7:00 · Indiranagar
            </p>
          </div>
        </a>
      </div>
    </section>
  );
}
