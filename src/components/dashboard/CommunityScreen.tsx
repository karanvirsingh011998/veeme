"use client";

import { useState } from "react";
import { COMMUNITY_LIST } from "@/lib/dashboard/demo-data";
import styles from "./app-ui.module.css";

/**
 * Community directory — For You / My Communities / Events.
 */
export function CommunityScreen() {
  const [tab, setTab] = useState("For You");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Community</div>
        <button type="button" className={styles.iconBtn} aria-label="Create community">
          ＋
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.chips}>
          {["For You", "My Communities", "Events"].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${tab === c ? styles.chipActive : ""}`}
              onClick={() => setTab(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {tab === "Events" ? (
          <div className={styles.card}>
            <h3 style={{ margin: 0 }}>Upcoming community events</h3>
            <p className={styles.small} style={{ marginTop: 8 }}>
              No events yet — join a community to see local meetups here.
            </p>
          </div>
        ) : (
          COMMUNITY_LIST.map((community) => (
            <button key={community.name} type="button" className={styles.listBtn}>
              <span className={styles.listIcon} aria-hidden="true">
                {community.icon}
              </span>
              <span className={styles.listMeta}>
                <h3>{community.name}</h3>
                <p>{community.members} • Shared interests</p>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ›
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}