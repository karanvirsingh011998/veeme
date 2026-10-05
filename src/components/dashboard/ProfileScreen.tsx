"use client";

import { useAuth } from "@/components/dashboard/AuthProvider";
import { buildFullPhoneNumber } from "@/lib/phone";
import styles from "./app-ui.module.css";

const MENU = [
  "Edit Profile",
  "Verification",
  "Bookings",
  "Wallet & Payments",
  "Settings",
  "Help & Support",
] as const;

/**
 * Profile — uses authenticated signup data; logout via auth layer.
 */
export function ProfileScreen() {
  const { user, profile, logout } = useAuth();

  const firstName = profile?.first_name || user?.firstName || "";
  const lastName = profile?.last_name || user?.lastName || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Vemee member";
  const email = profile?.email || user?.email;
  const gender = profile?.gender || user?.gender;
  const phone =
    user?.countryCode && user?.phoneNumber
      ? buildFullPhoneNumber(user.countryCode, user.phoneNumber)
      : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Profile</div>
        <button type="button" className={styles.iconBtn} aria-label="Settings">
          ⚙
        </button>
      </header>

      <div className={`${styles.content} ${styles.profile}`}>
        <div className={styles.profileImg} aria-hidden="true">
          🧑
        </div>
        <h2>{displayName}</h2>
        {phone ? <p>{phone}</p> : null}
        {email ? <p>{email}</p> : null}
        {gender ? <p>{gender}</p> : null}
        <span className={styles.tag}>✓ Phone verified</span>
        <p>
          Exploring new places, good food and meaningful conversations.
        </p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <b>12</b>
            <span>Connections</span>
          </div>
          <div className={styles.stat}>
            <b>5</b>
            <span>Communities</span>
          </div>
          <div className={styles.stat}>
            <b>8</b>
            <span>Experiences</span>
          </div>
        </div>

        {MENU.map((item) => (
          <button key={item} type="button" className={styles.setting}>
            <b>{item}</b>
            <span className={styles.arrow}>›</span>
          </button>
        ))}

        <button type="button" className={styles.primary} style={{ marginTop: 12 }}>
          ＋ Create a Group Experience
        </button>

        <button
          type="button"
          className={styles.setting}
          onClick={() => void logout()}
          style={{ marginTop: 10, justifyContent: "center", color: "#b44" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}