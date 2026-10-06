import { PeopleScreen } from "@/components/dashboard/people/PeopleScreen";

export const metadata = {
  title: "People — Vemee",
};

export default function PeoplePage() {
  return (
    <div style={{ padding: "16px 16px 28px", maxWidth: 900, margin: "0 auto" }}>
      <PeopleScreen />
    </div>
  );
}
