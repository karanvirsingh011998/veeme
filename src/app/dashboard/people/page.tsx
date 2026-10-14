import { PeopleScreen } from "@/components/dashboard/people/PeopleScreen";

export const metadata = {
  title: "People — Vemee",
};

export default function PeoplePage() {
  return (
    <div style={{ padding: "22px 19px 30px", maxWidth: 1120, margin: "0 auto" }}>
      <PeopleScreen />
    </div>
  );
}
