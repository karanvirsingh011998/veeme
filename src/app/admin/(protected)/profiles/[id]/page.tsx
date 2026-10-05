import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminUser } from "@/lib/admin/users";
import styles from "../profiles.module.css";
import detailStyles from "./profile-detail.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Profile ${id.slice(0, 8)} — Vemee Admin` };
}

/**
 * Full single-profile admin view with every profile field.
 */
export default async function AdminProfileDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const user = await getAdminUser(id);
  if (!user) notFound();

  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.display_name ||
    "Member";

  const fields: { label: string; value: string }[] = [
    { label: "Profile ID", value: user.id },
    { label: "Display name", value: user.display_name || "—" },
    { label: "First name", value: user.first_name || "—" },
    { label: "Last name", value: user.last_name || "—" },
    { label: "Email", value: user.email || "—" },
    { label: "Gender", value: user.gender || "—" },
    { label: "Country code", value: user.country_code || "—" },
    { label: "Phone number", value: user.phone_number || "—" },
    {
      label: "Phone verified at",
      value: user.phone_verified_at
        ? new Date(user.phone_verified_at).toLocaleString()
        : "—",
    },
    { label: "City", value: user.city || "—" },
    { label: "Avatar URL", value: user.avatar_url || "—" },
    { label: "Bio", value: user.bio || "—" },
    { label: "Account status", value: user.account_status },
    { label: "Admin", value: user.is_admin ? "Yes" : "No" },
    {
      label: "Created",
      value: user.created_at ? new Date(user.created_at).toLocaleString() : "—",
    },
    {
      label: "Updated",
      value: user.updated_at ? new Date(user.updated_at).toLocaleString() : "—",
    },
  ];

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>
        <Link href="/admin/profiles" className={detailStyles.back}>
          ← Profiles
        </Link>
      </p>
      <h1 className={styles.title}>{name}</h1>
      <p className={styles.copy}>Complete profile record</p>

      <dl className={detailStyles.grid}>
        {fields.map((field) => (
          <div key={field.label} className={detailStyles.item}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
