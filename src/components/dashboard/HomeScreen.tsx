"use client";

import Link from "next/link";
import { useAuth } from "@/components/dashboard/AuthProvider";
import {
  APP_CATEGORIES,
  GROUP_EXPERIENCES,
  MOMENTS,
  PEOPLE_CARDS,
  greetingLabel,
} from "@/lib/dashboard/demo-data";
import styles from "./app-ui.module.css";

/**
 * Authenticated Home — greeting, search, categories, For You feed.
 */
export function HomeScreen() {
  const { user, profile } = useAuth();
  const firstName =
    profile?.first_name?.trim() ||
    user?.firstName?.trim() ||
    "there";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>Vemee</div>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          ♡
        </button>
      </header>

      <div className={styles.content}>
        <p className={styles.greeting}>{greetingLabel()}</p>
        <h1 className={styles.title}>{firstName} 👋</h1>
        <p className={styles.tagline}>Find your people. Make better plans.</p>

        <div className={styles.search}>
          <span aria-hidden="true">⌕</span>
          <input
            placeholder="Search people, plans & experiences"
            aria-label="Search people, plans and experiences"
          />
        </div>

        <div className={styles.categories}>
          {APP_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/dashboard/discover"
              className={styles.cat}
            >
              <b>{cat.icon}</b>
              {cat.label}
            </Link>
          ))}
        </div>

        <div className={styles.sectionHead}>
          <h2>For You</h2>
          <span className={styles.small}>Personalized</span>
        </div>

        <div className={styles.desktopGrid}>
          <div>
            {MOMENTS.slice(0, 1).map((moment) => (
              <article key={moment.title} className={styles.moment}>
                <div className={styles.momentHead}>
                  <div className={styles.mini}>👤</div>
                  <div>
                    <b>{moment.author}</b>
                    <p>
                      {moment.time} • {moment.place}
                    </p>
                  </div>
                </div>
                <div className={styles.momentVisual}>{moment.title}</div>
                <div className={styles.momentBody}>
                  <p>{moment.text}</p>
                  <span className={styles.tag}>{moment.type}</span>
                  <div className={styles.momentActions}>
                    ♡ 24 &nbsp;&nbsp; 💬 5 &nbsp;&nbsp; ↗ Share
                  </div>
                </div>
              </article>
            ))}

            {GROUP_EXPERIENCES.slice(0, 1).map((group) => (
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
                <div className={styles.row}>
                  <span className={styles.small}>
                    {group.joined}/{group.max} joined
                  </span>
                  <span className={styles.small}>
                    {group.max - group.joined} spots left
                  </span>
                </div>
                <div className={styles.progress}>
                  <span
                    style={{ width: `${(group.joined / group.max) * 100}%` }}
                  />
                </div>
                <button type="button" className={styles.primary}>
                  Join Group
                </button>
              </div>
            ))}

            {MOMENTS.slice(1, 2).map((moment) => (
              <article key={moment.title} className={styles.moment}>
                <div className={styles.momentHead}>
                  <div className={styles.mini}>👤</div>
                  <div>
                    <b>{moment.author}</b>
                    <p>
                      {moment.time} • {moment.place}
                    </p>
                  </div>
                </div>
                <div className={styles.momentVisual}>{moment.title}</div>
                <div className={styles.momentBody}>
                  <p>{moment.text}</p>
                  <span className={styles.tag}>{moment.type}</span>
                  <div className={styles.momentActions}>
                    ♡ 18 &nbsp;&nbsp; 💬 3 &nbsp;&nbsp; ↗ Share
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div>
            <div className={styles.sectionHead}>
              <h2>People you may connect with</h2>
              <Link href="/dashboard/discover" className={styles.see}>
                See more
              </Link>
            </div>
            <div className={styles.people}>
              {PEOPLE_CARDS.map((person) => (
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

            <div className={styles.sectionHead}>
              <h2>Group experiences</h2>
            </div>
            {GROUP_EXPERIENCES.slice(1).map((group) => (
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
                  <span
                    style={{ width: `${(group.joined / group.max) * 100}%` }}
                  />
                </div>
                <button type="button" className={styles.primary}>
                  Join Group
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}