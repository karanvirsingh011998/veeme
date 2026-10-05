import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminConversations } from "@/lib/admin/chats";
import styles from "./chats.module.css";

export const metadata = {
  title: "Chats — Vemee Admin",
};

/**
 * Admin chats tab — conversation directory with previews.
 */
export default async function AdminChatsPage() {
  await requireAdmin();
  const conversations = await listAdminConversations();

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Messaging</p>
      <h1 className={styles.title}>Chats</h1>
      <p className={styles.copy}>
        {conversations.length} conversation
        {conversations.length === 1 ? "" : "s"} visible to admins.
      </p>

      {conversations.length === 0 ? (
        <div className={styles.empty}>
          <p>No chats yet.</p>
          <p className={styles.hint}>
            Conversations and messages from the app will appear here. Requires
            `SUPABASE_SERVICE_ROLE_KEY` for admin reads.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {conversations.map((chat) => (
            <li key={chat.id}>
              <Link href={`/admin/chats/${chat.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <h2>
                    {chat.title ||
                      `${chat.type.charAt(0).toUpperCase()}${chat.type.slice(1)} chat`}
                  </h2>
                  <span className={styles.type}>{chat.type}</span>
                </div>
                <p className={styles.preview}>
                  {chat.last_message || "No messages yet"}
                </p>
                <div className={styles.meta}>
                  <span>{chat.participant_count} people</span>
                  <span>{chat.message_count} messages</span>
                  <span>
                    {chat.last_message_at
                      ? new Date(chat.last_message_at).toLocaleString()
                      : new Date(chat.updated_at).toLocaleString()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
