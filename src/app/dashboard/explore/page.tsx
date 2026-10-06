import { ExplorePlansScreen } from "@/components/dashboard/plans/ExplorePlansScreen";

export const metadata = {
  title: "Explore Plans — Vemee",
};

export default function ExplorePage() {
  return (
    <div style={{ padding: "16px 16px 28px", maxWidth: 960, margin: "0 auto" }}>
      <ExplorePlansScreen />
    </div>
  );
}
