import styles from "./ProductVisual.module.css";

/**
 * CSS product mockup reflecting Vemee app cards (people + group experience).
 * Used in both mobile and desktop hero compositions.
 */
export function ProductVisual() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.phone}>
        <div className={styles.phoneBar}>
          <span>Vemee</span>
          <span className={styles.dot}>♡</span>
        </div>
        <div className={styles.phoneBody}>
          <p className={styles.kicker}>For You</p>
          <p className={styles.panelTitle}>People you may connect with</p>

          <div className={styles.personRow}>
            <div className={styles.person}>
              <div className={styles.avatar}>👩</div>
              <div>
                <strong>Priya</strong>
                <p>Travel Buddy</p>
                <div className={styles.meta}>
                  <span>★ 4.8</span>
                  <span className={styles.verified}>✓ Verified</span>
                </div>
              </div>
            </div>
            <div className={styles.person}>
              <div className={styles.avatar}>🧔</div>
              <div>
                <strong>Rahul</strong>
                <p>Workout Partner</p>
                <div className={styles.meta}>
                  <span>★ 4.9</span>
                  <span className={styles.verified}>✓ Verified</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.groupCard}>
            <div className={styles.groupThumb}>🥾</div>
            <div>
              <span className={styles.tag}>Group Experience</span>
              <strong>Saturday Sunrise Trek</strong>
              <p>6/10 joined · ₹799 / person</p>
              <div className={styles.progress}>
                <span style={{ width: "60%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatTrek}`}>
        <span>🥾</span>
        <div>
          <strong>Saturday Sunrise Trek</strong>
          <p>6/10 joined · ₹799 / person</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatWorkout}`}>
        <span>🏋️</span>
        <div>
          <strong>Workout</strong>
          <p>2 people looking nearby</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatCoffee}`}>
        <span>☕</span>
        <div>
          <strong>Coffee & conversations</strong>
          <p>Looking for someone this weekend</p>
        </div>
      </div>
    </div>
  );
}