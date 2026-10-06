import { PlanDetailScreen } from "@/components/dashboard/plans/PlanDetailScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Plan ${id.slice(0, 8)} — Vemee` };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div style={{ padding: "16px 16px 28px", maxWidth: 720, margin: "0 auto" }}>
      <PlanDetailScreen planId={id} />
    </div>
  );
}
