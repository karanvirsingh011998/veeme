import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/admin/users";
import styles from "./users.module.css";

export const metadata = {
  title: "Users — Vemee Admin",
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listAdminUsers();

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Directory</p>
      <h1 className={styles.title}>Users</h1>
      <p className={styles.copy}>
        {users.length} profile{users.length === 1 ? "" : "s"} visible to admins.
      </p>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <p>No users found yet.</p>
          <p className={styles.hint}>
            In development mode, complete a mobile signup to create a local
            profile. With Supabase, profiles appear after Auth users are created
            and `profiles.is_admin` is set for admins.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                      user.display_name ||
                      "—"}
                  </td>
                  <td>{user.email || "—"}</td>
                  <td>
                    {user.country_code && user.phone_number
                      ? `${user.country_code} ${user.phone_number}`
                      : "—"}
                  </td>
                  <td>{user.gender || "—"}</td>
                  <td>
                    <Link href={`/admin/users/${user.id}`} className={styles.link}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}