import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductVisual } from "./ProductVisual";
import styles from "./Hero.module.css";

/**
 * Landing hero — compact mobile stack with above-the-fold CTA;
 * desktop two-column marketplace composition.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.brandMobile}>Vemee</p>
          <h1 id="hero-heading" className={styles.title}>
            Find your people.
            <br />
            Make better plans.
          </h1>
          <p className={styles.subtitle}>
            Discover people, experiences and communities for travel, workouts,
            events, food, gaming and more.
          </p>
          <div className={styles.actions}>
            <Button href="/signup" variant="primary" className={styles.primary}>
              Get started
            </Button>
            <Link href="#discover" className={styles.explore}>
              Explore Vemee
            </Link>
          </div>
        </div>

        <div className={styles.visual}>
          <ProductVisual />
        </div>
      </div>
    </section>
  );
}