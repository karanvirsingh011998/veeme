import { redirect } from "next/navigation";

/** Community tab replaced by People in the plans-first nav. */
export default function CommunityRedirectPage() {
  redirect("/dashboard/people");
}
