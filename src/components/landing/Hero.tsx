import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HERO_USE_CASES } from "@/lib/constants";
import { ProductVisual } from "./ProductVisual";
import styles from "./Hero.module.css";

/**
 * Landing hero — brand-first composition with activity discovery visual.
 * Use-case chips live below the primary fold to keep the first viewport clean.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.brand}>Vemee</p>
          <h1 id="hero-heading" className={styles.title}>
            Find your people.
            <br />
            Do more together.
          </h1>
          <p className={styles.subtitle}>
            A trusted way to find people, plans and communities around things
            you actually enjoy.
          </p>
          <div className={styles.actions}>
            <Button href="/signup" variant="primary" className={styles.primary}>
              Get Started
            </Button>
            <Button href="#discover" variant="secondary">
              Explore Vemee
            </Button>
          </div>
          <p className={styles.assurance}>
            No dating. No awkward networking. Just people with common plans and
            interests.
          </p>
        </div>

        <div className={styles.visual}>
          <ProductVisual />
        </div>
      </div>

      <div className={styles.useCases} aria-label="Popular plans on Vemee">
        <div className={`hide-scrollbar ${styles.useCaseTrack}`}>
          {HERO_USE_CASES.map((item) => (
            <Link
              key={item.label}
              href="/signup"
              className={styles.useCase}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
