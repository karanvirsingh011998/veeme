import { Logo } from "@/components/ui/Logo";
import styles from "./SplashScreen.module.css";

type SplashScreenProps = {
  /** Optional status under the brand */
  message?: string;
  /** Full viewport overlay (default true) */
  fullScreen?: boolean;
};

/**
 * Branded Vemee splash / loading screen.
 */
export function SplashScreen({
  message = "Finding your people…",
  fullScreen = true,
}: SplashScreenProps) {
  return (
    <div
      className={`${styles.splash} ${fullScreen ? styles.full : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.brand}>
        <Logo height={168} priority className={styles.logo} />
        <p className={styles.tagline}>Find your people. Do more together.</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
