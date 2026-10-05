import { Button } from "@/components/ui/Button";
import styles from "./FinalCta.module.css";

/**
 * Closing CTA — restrained sage container with Get started + Log in.
 */
export function FinalCta() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.panel}>
          <h2 className={styles.title}>
            Your next plan starts with the right person.
          </h2>
          <p className={styles.copy}>
            Create your profile, verify once, and start discovering people and
            experiences nearby.
          </p>
          <div className={styles.actions}>
            <Button href="/signup" variant="primary">
              Get started
            </Button>
            <Button href="/login" variant="secondary">
              Log in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}