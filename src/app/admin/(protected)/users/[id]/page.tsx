import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Legacy user detail — redirects to Profiles full view.
 */
export default async function AdminUserRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/profiles/${id}`);
}
