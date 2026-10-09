import type { Metadata } from "next";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About — Vemee",
  description:
    "Vemee helps people find company for real plans — sports, coffee, study, travel, and events.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <main className={`container ${styles.main}`}>
        <p className={styles.eyebrow}>About</p>
        <h1>People for real plans.</h1>
        <p className={styles.lead}>
          Vemee is a place to find someone to do the next thing with. A morning
          game, a coffee, a study block, a day trip. You join a plan, not a
          dating profile.
        </p>

        <section>
          <h2>What we built it for</h2>
          <p>
            Making plans with new people is usually awkward. Vemee starts with
            the activity, so you already know why you are meeting. Show up, do
            the thing, and see who you click with.
          </p>
        </section>

        <section>
          <h2>How a day on Vemee works</h2>
          <ul>
            <li>Pick a plan that fits your mood, or post one of your own.</li>
            <li>See people nearby who want to do the same kind of thing.</li>
            <li>Connect and chat so the meetup is simple to arrange.</li>
          </ul>
        </section>

        <section>
          <h2>Membership</h2>
          <p>
            Every new account starts on Free. Pro, Ultra Pro, and Ultra Promax
            are there when you want more room for the plans you host.{" "}
            <Link href="/membership">See membership</Link>.
          </p>
        </section>

        <section>
          <h2>Showing up safely</h2>
          <p>
            Members join with a verified phone number. You can rate people so
            recommendations fit you better, and you stay in control of who you
            meet. Vemee is for shared activities, not dating.
          </p>
        </section>
      </main>
    </div>
  );
}
