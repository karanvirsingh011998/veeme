import { redirect } from "next/navigation";

/**
 * Legacy /admin/users route — redirects to Profiles full view.
 */
export default function AdminUsersRedirectPage() {
  redirect("/admin/profiles");
}
