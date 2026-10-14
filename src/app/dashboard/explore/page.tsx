import { ExplorePlansScreen } from "@/components/dashboard/plans/ExplorePlansScreen";

export const metadata = {
  title: "Explore Plans — Vemee",
};

export default function ExplorePage() {
  return (
    <div style={{ padding: "22px 19px 30px", maxWidth: 1080, margin: "0 auto" }}>
      <ExplorePlansScreen />
    </div>
  );
}
