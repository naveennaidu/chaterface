import { id } from "@instantdb/react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useDatabase } from "../providers/database-provider";
import { useAuth } from "../providers/auth-provider";

export const useCreateConversation = () => {
  const { sessionId } = useAuth();
  const { db } = useDatabase();
  const router = useRouter();

  const createConversationAndRedirect = async () => {
    const conversationId = id();
    const conversation = await db.transact(db.tx.conversations[conversationId].update({
      name: DateTime.now().toFormat('MMM d, yyyy, h:mm a'),
      createdAt: DateTime.now().toISO(),
      sessionId: sessionId ?? '',
    }));
    router.replace(`/conversations/${conversationId}`);
  };

  return { createConversationAndRedirect };
}; 