import styles from "./Skeletons.module.css";

function Bone({ className }: { className: string }) {
  return <span className={`${styles.bone} ${className}`} />;
}

export function PlanCardSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.plan}>
          <Bone className={styles.planImage} />
          <div className={styles.planBody}>
            <Bone className={styles.lineShort} />
            <Bone className={styles.line} />
            <Bone className={styles.lineMid} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.stack} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.user}>
          <Bone className={styles.avatar} />
          <div className={styles.userCopy}>
            <Bone className={styles.lineMid} />
            <Bone className={styles.lineShort} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatListSkeleton({ count = 4 }: { count?: number }) {
  return <UserCardSkeleton count={count} />;
}

export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.error} role="alert">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
