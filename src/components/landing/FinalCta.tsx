import { Button } from "@/components/ui/Button";
import styles from "./FinalCta.module.css";

/**
 * Peach closing CTA — “Your seat's still open.”
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
          <h2 id="final-cta-heading" className={styles.title}>
            Your seat&apos;s still open.
          </h2>
          <p className={styles.copy}>
            Join free and find someone to do the next thing with.
          </p>
          <Button href="/signup" variant="secondary" className={styles.cta}>
            Find your people <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
