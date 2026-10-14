import { ChatInboxScreen } from "@/components/dashboard/chat/ChatInboxScreen";
import { ChatThreadScreen } from "@/components/dashboard/chat/ChatThreadScreen";
import styles from "@/components/dashboard/social.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className={styles.chatStage}>
      <div className={styles.inboxCol}>
        <ChatInboxScreen embedded />
      </div>
      <ChatThreadScreen conversationId={id} />
    </div>
  );
}
