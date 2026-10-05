"use client";

import { useMemo, useState } from "react";
import {
  APP_CATEGORIES,
  GROUP_EXPERIENCES,
  PEOPLE_CARDS,
} from "@/lib/dashboard/demo-data";
import styles from "./app-ui.module.css";

/**
 * Discover — people / experiences with category and time chips.
 */
export function DiscoverScreen() {
  const [category, setCategory] = useState("All");
  const [timeChip, setTimeChip] = useState("Nearby");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"people" | "groups">("people");

  const categories = ["All", ...APP_CATEGORIES.map((c) => c.label).slice(0, 5)];

  const people = useMemo(() => {
    return PEOPLE_CARDS.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.role.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        category === "All" ||
        p.role.toLowerCase().includes(category.toLowerCase());
      return matchesQuery && matchesCategory;
    });
  }, [category, query]);

  const groups = useMemo(() => {
    return GROUP_EXPERIENCES.filter((g) => {
      return (
        !query ||
        g.title.toLowerCase().includes(query.toLowerCase()) ||
        g.place.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Discover</div>
        <button type="button" className={styles.iconBtn} aria-label="Filters">
          ⚙
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            placeholder="Search people, groups or experiences"
            aria-label="Search people, groups or experiences"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.chips}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${category === c ? styles.chipActive : ""}`}
              onClick={() => {
                setCategory(c);
                setMode(c === "All" ? mode : "people");
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className={styles.chips}>
          {["Nearby", "Today", "This Weekend", "Filters"].map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${timeChip === c ? styles.chipActive : ""}`}
              onClick={() => setTimeChip(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chip} ${mode === "people" ? styles.chipActive : ""}`}
            onClick={() => setMode("people")}
          >
            People
          </button>
          <button
            type="button"
            className={`${styles.chip} ${mode === "groups" ? styles.chipActive : ""}`}
            onClick={() => setMode("groups")}
          >
            Experiences
          </button>
        </div>

        {mode === "people" ? (
          people.length ? (
            <div className={styles.people} style={{ flexWrap: "wrap" }}>
              {people.map((person) => (
                <button key={person.name} type="button" className={styles.person}>
                  <div className={styles.personImg}>{person.avatar}</div>
                  <div className={styles.personMeta}>
                    <h3>{person.name}</h3>
                    <p>{person.role}</p>
                    <div className={styles.rating}>★ {person.rating}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.small}>No people match your search.</p>
          )
        ) : groups.length ? (
          groups.map((group) => (
            <div key={group.title} className={styles.card}>
              <div className={styles.groupHead}>
                <div className={styles.groupThumb}>{group.icon}</div>
                <div>
                  <span className={styles.tag}>Group Experience</span>
                  <h3>{group.title}</h3>
                  <p>
                    {group.time} • {group.place}
                  </p>
                  <p>
                    <b>₹{group.price}</b> / person
                  </p>
                </div>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${(group.joined / group.max) * 100}%` }} />
              </div>
              <button type="button" className={styles.primary}>
                Join Group
              </button>
            </div>
          ))
        ) : (
          <p className={styles.small}>No experiences match your search.</p>
        )}
      </div>
    </div>
  );
}