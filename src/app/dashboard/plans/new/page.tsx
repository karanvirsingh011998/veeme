import { CreatePlanScreen } from "@/components/dashboard/plans/CreatePlanScreen";

export const metadata = {
  title: "Create a Plan — Vemee",
};

export default function CreatePlanPage() {
  return (
    <div style={{ padding: "16px 16px 28px", maxWidth: 720, margin: "0 auto" }}>
      <CreatePlanScreen />
    </div>
  );
}
