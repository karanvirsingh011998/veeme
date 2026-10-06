import { redirect } from "next/navigation";

/** Legacy Discover route → Explore Plans. */
export default function DiscoverRedirectPage() {
  redirect("/dashboard/explore");
}
