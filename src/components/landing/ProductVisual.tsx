import styles from "./ProductVisual.module.css";

/**
 * Activity-discovery visual for the hero — plan-first cards, not dating profiles.
 */
export function ProductVisual() {
  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={styles.phone}>
        <div className={styles.phoneBar}>
          <span>Vemee</span>
          <span className={styles.live}>Live plans</span>
        </div>
        <div className={styles.phoneBody}>
          <p className={styles.kicker}>Plans near you</p>
          <p className={styles.panelTitle}>People looking to do the same</p>

          <div className={styles.planList}>
            <div className={styles.plan}>
              <div className={`${styles.badge} ${styles.badgeOutdoor}`}>🏏</div>
              <div>
                <strong>Weekend cricket</strong>
                <p>8 nearby · Saturday evening</p>
              </div>
            </div>
            <div className={styles.plan}>
              <div className={`${styles.badge} ${styles.badgeGaming}`}>🎮</div>
              <div>
                <strong>PUBG squad tonight</strong>
                <p>Looking for 2 more · Ready now</p>
              </div>
            </div>
            <div className={styles.plan}>
              <div className={`${styles.badge} ${styles.badgeTravel}`}>🥾</div>
              <div>
                <strong>Saturday sunrise trek</strong>
                <p>6/10 joined · Open to newcomers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatA}`}>
        <span>✈️</span>
        <div>
          <strong>Travel companions</strong>
          <p>Goa trip · next weekend</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatB}`}>
        <span>🏋️</span>
        <div>
          <strong>Gym partner</strong>
          <p>Morning strength · nearby</p>
        </div>
      </div>

      <div className={`${styles.float} ${styles.floatC}`}>
        <span>☕</span>
        <div>
          <strong>Coffee & chat</strong>
          <p>Someone free this afternoon</p>
        </div>
      </div>
    </div>
  );
}
