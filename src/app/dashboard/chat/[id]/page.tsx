import { ChatThreadScreen } from "@/components/dashboard/chat/ChatThreadScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  return <ChatThreadScreen conversationId={id} />;
}
