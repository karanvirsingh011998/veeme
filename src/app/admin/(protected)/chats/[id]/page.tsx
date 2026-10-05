import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminConversation } from "@/lib/admin/chats";
import styles from "../chats.module.css";
import detailStyles from "./chat-detail.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Chat ${id.slice(0, 8)} — Vemee Admin` };
}

/**
 * Full conversation transcript for admin moderation.
 */
export default async function AdminChatDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { conversation, messages } = await getAdminConversation(id);
  if (!conversation) notFound();

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>
        <Link href="/admin/chats" className={detailStyles.back}>
          ← Chats
        </Link>
      </p>
      <h1 className={styles.title}>
        {conversation.title ||
          `${conversation.type.charAt(0).toUpperCase()}${conversation.type.slice(1)} chat`}
      </h1>
      <p className={styles.copy}>
        {conversation.participant_count} participants ·{" "}
        {conversation.message_count} messages · {conversation.type}
      </p>

      <div className={detailStyles.thread}>
        {messages.length === 0 ? (
          <p className={detailStyles.emptyMsg}>No messages in this chat.</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`${detailStyles.bubble} ${message.is_system ? detailStyles.system : ""}`}
            >
              <header className={detailStyles.bubbleHead}>
                <strong>
                  {message.is_system
                    ? "System"
                    : message.sender_name || message.sender_id.slice(0, 8)}
                </strong>
                <time dateTime={message.created_at}>
                  {new Date(message.created_at).toLocaleString()}
                </time>
              </header>
              <p>{message.body || (message.image_url ? "[Image]" : "—")}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
