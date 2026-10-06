import styles from "../social.module.css";

type ScreenLoadingProps = {
  /** Short status line under the spinner */
  message?: string;
  /** Compact inline block for a section (not full-page) */
  inline?: boolean;
};

/**
 * Consistent loading state while remote data is in flight.
 * Prefer this over empty/“no data” copy until the first fetch finishes.
 */
export function ScreenLoading({
  message = "Loading…",
  inline = false,
}: ScreenLoadingProps) {
  return (
    <div
      className={inline ? styles.loadingInline : styles.loadingBlock}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <p className={styles.loadingMessage}>{message}</p>
    </div>
  );
}
