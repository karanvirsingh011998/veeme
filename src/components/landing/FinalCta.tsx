import { Button } from "@/components/ui/Button";
import styles from "./FinalCta.module.css";

/**
 * Closing CTA — conversion-focused end of the landing journey.
 */
export function FinalCta() {
  return (
    <section
      id="contact"
      className={`section ${styles.section}`}
      aria-labelledby="final-cta-heading"
    >
      <div className="container">
        <div className={styles.panel}>
          <p className={styles.brand}>Vemee</p>
          <h2 id="final-cta-heading" className={styles.title}>
            Find your people. Make better plans.
          </h2>
          <p className={styles.copy}>
            Whatever you want to do, there are people out there who want to do
            it too.
          </p>
          <p className={styles.tagline}>Find your people. Do more together.</p>
          <div className={styles.actions}>
            <Button href="/signup" variant="primary">
              Get Started
            </Button>
            <Button href="#discover" variant="secondary">
              Explore Vemee
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
