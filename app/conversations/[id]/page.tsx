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
import { models } from "@/constants/models";
import { useAuth } from "@/lib/instant-client";
type Conversation = InstaQLEntity<AppSchema, "conversations">;
type Message = InstaQLEntity<AppSchema, "messages">;
import { useRouter } from "next/navigation";

export default function ConversationPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  const { db } = useDatabase();
  const { getProviderKey } = useKey();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);
  const [messagesForChat, setMessagesForChat] = useState<UIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { isLoading, data, error } = db.useQuery({
    conversations: {
      $: {
        where: { id: id as string }
      }
    },
    messages: {
      $: {
        where: {
          conversation: id as string
        }
      }
    }
  }, { ruleParams: { userId: user?.id ?? '' } });

  console.log(data)

  useEffect(() => {
    if(data && !data?.conversations[0]){
      router.push('/');
    }
  }, [data]);

  const { newConversationMessage, setNewConversationMessage, setNewConversationId, newConversationId } = useNewConversation();

  const { messages, input, handleInputChange, append, setInput, status } = useChat({
    api: '/api/chat',
    headers: {
      'Authorization': `Bearer ${getProviderKey(selectedModel)}`
    },
    body: {
      model: selectedModel
    },
    onError: async (error) => {
      setIsProcessing(false);
      setErrorMessage(error.message);
    },
    onFinish: async (message) => {
      setIsProcessing(false);
      const aiMessageId = newInstantId();
      await db.transact(db.tx.messages[aiMessageId].ruleParams({ userId: user?.id }).update({
        content: message.content,
        role: "assistant",
        createdAt: DateTime.now().toISO(),
        model: selectedModel,
        userId: user?.id
      }).link({ conversation: id as string }));
    },
    initialMessages: data?.messages.map((message) => ({
      role: message.role as "data" | "system" | "user" | "assistant",
      content: message.content,
      id: message.id,
      parts: []
    })) ?? []
  });

  async function createMessage(content: string) {
    if (!id) {
      console.error('No conversation ID available');
      return;
    }

    setInput("");
    
    const newMessageId = newInstantId();
    
    // Create user message

    setIsProcessing(true);
    setErrorMessage(null);

    append({
      role: "user",
      content: content,
      parts: []
    });

    await db.transact(db.tx.messages[newMessageId].ruleParams({ userId: user?.id }).update({
      content: content,
      createdAt: DateTime.now().toISO(),
      role: "user",
      model: selectedModel,
      userId: user?.id
    }).link({ conversation: id }));
  }

  return (
    <div className="flex flex-col w-full h-full mx-auto relative">
      <div className="flex-1 overflow-y-auto pt-24 h-full">
        <MessageList messages={messages} messagesOnDB={data?.messages ?? []} />
      </div>

      <NewMessageInput input={input} handleInputChange={handleInputChange} createMessage={createMessage} selectedModel={selectedModel} setSelectedModel={setSelectedModel} isProcessing={isProcessing} errorMessage={errorMessage} />
    </div>
  );
}
