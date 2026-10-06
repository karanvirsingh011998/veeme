import { PersonProfileScreen } from "@/components/dashboard/people/PersonProfileScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div style={{ padding: "16px 16px 28px", maxWidth: 720, margin: "0 auto" }}>
      <PersonProfileScreen personId={id} />
    </div>
  );
}
