import type { Metadata } from "next";
import { MembershipScreen } from "@/components/membership/MembershipScreen";

export const metadata: Metadata = {
  title: "Membership — Vemee",
  description: "Free, Pro, Ultra Pro, and Ultra Promax memberships.",
};

export default function MembershipPage() {
  return <MembershipScreen />;
}
