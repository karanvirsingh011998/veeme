import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminUser } from "@/lib/admin/users";
import styles from "../users.module.css";
import detailStyles from "./user-detail.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `User ${id.slice(0, 8)} — Vemee Admin` };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const user = await getAdminUser(id);
  if (!user) notFound();

  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.display_name ||
    "Member";

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>
        <Link href="/admin/users" className={detailStyles.back}>
          ← Users
        </Link>
      </p>
      <h1 className={styles.title}>{name}</h1>
      <p className={styles.copy}>Profile ID: {user.id}</p>

      <dl className={detailStyles.grid}>
        <div>
          <dt>First name</dt>
          <dd>{user.first_name || "—"}</dd>
        </div>
        <div>
          <dt>Last name</dt>
          <dd>{user.last_name || "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email || "—"}</dd>
        </div>
        <div>
          <dt>Gender</dt>
          <dd>{user.gender || "—"}</dd>
        </div>
        <div>
          <dt>Country code</dt>
          <dd>{user.country_code || "—"}</dd>
        </div>
        <div>
          <dt>Phone number</dt>
          <dd>{user.phone_number || "—"}</dd>
        </div>
        <div>
          <dt>Admin</dt>
          <dd>{user.is_admin ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{user.account_status}</dd>
        </div>
      </dl>
    </div>
  );
}