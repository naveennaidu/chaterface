'use client';

import { useAuth } from "@/app/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDatabase } from "@/app/providers/database-provider";
import { id } from "@instantdb/react";
import { DateTime } from "luxon";

export default function NewConversation() {
  const { sessionId } = useAuth();
  const router = useRouter();
  const { db } = useDatabase();
  useEffect(() => {
    if (sessionId) {
      createConversation();
    }
  }, [sessionId]);

  const createConversation = async () => {
    const conversationId = id();
    const conversation = await db.transact(db.tx.conversations[conversationId].update({
      name: 'New Conversation',
      createdAt: DateTime.now().toISO(),
      sessionId: sessionId ?? '',
    }));
    router.replace(`/conversations/${conversationId}`);
  };

  return (
    <div>
      <h1>New Conversation</h1>
    </div>
  );
}