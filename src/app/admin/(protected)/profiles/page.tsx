import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/users";
import styles from "./profiles.module.css";

export const metadata = {
  title: "Profiles — Vemee Admin",
};

/**
 * Full profiles directory — card grid with complete member fields.
 */
export default async function AdminProfilesPage() {
  await requireAdmin();
  const users = await listAdminUsers();

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Members</p>
      <h1 className={styles.title}>Profiles</h1>
      <p className={styles.copy}>
        Full view of {users.length} member profile
        {users.length === 1 ? "" : "s"}.
      </p>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <p>No profiles found yet.</p>
          <p className={styles.hint}>
            Complete a mobile signup to create a profile, or sync members from
            Supabase Auth.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {users.map((user) => {
            const name =
              [user.first_name, user.last_name].filter(Boolean).join(" ") ||
              user.display_name ||
              "Member";
            const phone =
              user.country_code && user.phone_number
                ? `${user.country_code} ${user.phone_number}`
                : "—";

            return (
              <article key={user.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <div className={styles.avatar} aria-hidden="true">
                    {(name[0] || "V").toUpperCase()}
                  </div>
                  <div>
                    <h2 className={styles.name}>{name}</h2>
                    <p className={styles.meta}>
                      {user.city || "City not set"} · {user.account_status}
                    </p>
                  </div>
                </div>

                <dl className={styles.fields}>
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{phone}</dd>
                  </div>
                  <div>
                    <dt>Gender</dt>
                    <dd>{user.gender || "—"}</dd>
                  </div>
                  <div>
                    <dt>Verified</dt>
                    <dd>{user.phone_verified_at ? "Phone verified" : "Unverified"}</dd>
                  </div>
                  <div className={styles.full}>
                    <dt>Bio</dt>
                    <dd>{user.bio || "—"}</dd>
                  </div>
                  <div>
                    <dt>Admin</dt>
                    <dd>{user.is_admin ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/admin/profiles/${user.id}`}
                  className={styles.link}
                >
                  Open full profile
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
