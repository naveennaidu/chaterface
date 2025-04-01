'use client';

import { useParams } from "next/navigation";
import { useDatabase } from "@/providers/database-provider";
import { useKey } from "@/providers/key-provider";
import { useEffect, useState } from "react";
import { id, InstaQLEntity, id as newInstantId } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";
import { useChat } from '@ai-sdk/react'
import { DateTime } from "luxon";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/message-list";
import NewMessageInput from "@/components/new-message-input";
import { UIMessage } from "ai";
import { useNewConversation } from "@/providers/new-conversation-provider";
type Conversation = InstaQLEntity<AppSchema, "conversations">;
type Message = InstaQLEntity<AppSchema, "messages">;

export default function ConversationPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { db } = useDatabase();
  const { providerKeys } = useKey();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [messagesForChat, setMessagesForChat] = useState<UIMessage[]>([]);

  const { isLoading, data, error } = db.useQuery({
    conversations: {
      $: {
        where: { id: id as string }
      },
      messages: {}
    }
  });

  const { newConversationMessage, setNewConversationMessage, setNewConversationId, newConversationId } = useNewConversation();

  const { messages, input, handleInputChange, append } = useChat({
    api: '/api/chat',
    headers: {
      'Authorization': `Bearer ${providerKeys.openai}`
    },
    body: {
      model: selectedModel ?? "openai/gpt-4o"
    },
    onFinish: async (message) => {
      const aiMessageId = newInstantId();
      await db.transact(db.tx.messages[aiMessageId].update({
        content: message.content,
        role: "assistant",
        createdAt: DateTime.now().toISO(),
        model: selectedModel ?? "openai/gpt-4o"
      }).link({ conversation: id as string }));
    },
    initialMessages: (data?.conversations[0]?.messages.length === 1) ? [] : data?.conversations[0]?.messages.map((message) => ({
      role: message.role as "data" | "system" | "user" | "assistant",
      content: message.content,
      id: message.id,
      parts: []
    })) ?? []
  });

  useEffect(() => {
    async function createInitialMessage(){
      if(data?.conversations[0]?.messages.length === 0 && newConversationMessage?.trim() && newConversationId === id){

      await db.transact(db.tx.messages[newInstantId()].update({
        content: newConversationMessage,
        role: "user",
        createdAt: DateTime.now().toISO(),
        model: "openai/gpt-4o"
      }).link({ conversation: newConversationId ?? "" }));

      setNewConversationMessage("");
      setNewConversationId("");

      append({
        role: "user",
        content: newConversationMessage,
          parts: []
        });
      }
    }
    createInitialMessage();
  }, [data]);


  async function createMessage(content: string) {
    if (!id) {
      console.error('No conversation ID available');
      return;
    }
    
    const newMessageId = newInstantId();
    
    // Create user message
    await db.transact(db.tx.messages[newMessageId].update({
      content: content,
      createdAt: DateTime.now().toISO(),
      role: "user",
      model: selectedModel ?? "openai/gpt-4o"
    }).link({ conversation: id }));

    append({
      role: "user",
      content: content,
      parts: []
    });
  }

  return (
    <div className="flex flex-col w-full h-full mx-auto relative">
      <div className="flex-1 overflow-y-auto pt-24 h-full">
        <MessageList messages={messages} messagesOnDB={data?.conversations[0]?.messages ?? []} />
      </div>

      <NewMessageInput input={input} handleInputChange={handleInputChange} createMessage={createMessage} />
    </div>
  );
}
