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
        <span className={styles.mark} aria-hidden="true">
          v
        </span>
        <p className={styles.wordmark}>Vemee</p>
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
