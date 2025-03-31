'use client';

import { useDatabase } from "@/app/providers/database-provider";
import { useKey } from "@/app/providers/key-provider";
import { AppSchema } from "@/instant.schema";
import { InstaQLEntity } from "@instantdb/react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { DateTime } from "luxon";
import Button from "@/components/button";
import { useParams } from "next/navigation";
import { id } from "@instantdb/react";
import MessageComponent from "@/components/message";
import { useChat, Message as VercelAIMessage } from '@ai-sdk/react';
import { CoreMessage } from "ai";
import ChatInput from "@/components/ChatInput";

type DBMessage = InstaQLEntity<AppSchema, "messages">;

export default function ConversationPage() {
  const { db } = useDatabase();
  const { providerKeys } = useKey();
  const [conversation, setConversation] = useState<InstaQLEntity<AppSchema, "conversations", { messages: object }> | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (providerKeys.openai) return 'openai/gpt-4o';
    if (providerKeys.anthropic) return 'anthropic/claude-3-5-sonnet';
    if (providerKeys.google) return 'google/gemini-2.0-flash';
    return 'openai/gpt-4o';
  });
  const [error, setError] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { id: conversationId } = useParams();
  const { data: conversationData } = db.useQuery({
    conversations: {
      $: { where: { id: conversationId as string } },
      messages: {
        $: { select: ['id', 'role', 'content', 'createdAt', 'model'] }
      }
    }
  });

  const models = useMemo(() => [
    { id: 'openai/gpt-4o', name: 'gpt-4o' },
    { id: 'openai/gpt-4o-mini', name: 'gpt-4o-mini' },
    { id: 'anthropic/claude-3-5-sonnet', name: 'claude-3-5-sonnet' },
    { id: 'anthropic/claude-3-7-sonnet', name: 'claude-3-7-sonnet' },
    { id: 'google/gemini-2.0-flash', name: 'gemini-2.0-flash' },
  ], []);

  const currentApiKey = useMemo(() => {
    const provider = selectedModel.split('/')[0] as keyof typeof providerKeys;
    return providerKeys[provider];
  }, [selectedModel, providerKeys]);

  const initialMessages = useMemo(() => {
    const dbMessages = conversationData?.conversations?.[0]?.messages;
    if (!dbMessages) return [];

    return dbMessages
      .map((m: DBMessage): VercelAIMessage | null => {
        if (!m.id || typeof m.content !== 'string' || !m.role || !m.createdAt) return null;
        const role = m.role as VercelAIMessage['role'];
        if (!['user', 'assistant', 'system', 'function', 'tool', 'data'].includes(role)) return null;

        return {
          id: m.id,
          role: role,
          content: m.content,
          createdAt: new Date(m.createdAt)
        };
      })
      .filter((m): m is VercelAIMessage => m !== null)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  }, [conversationData]);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, setInput } = useChat({
    api: '/api/chat',
    id: conversationId as string,
    body: {
      model: selectedModel,
      conversationId: conversationId as string
    },
    headers: useMemo(() => (
      currentApiKey
          ? { 'Authorization': `Bearer ${currentApiKey}` }
          : undefined
    ), [currentApiKey]),
    initialMessages: initialMessages,
    onFinish: async (message: VercelAIMessage) => {
      if (message.role === 'assistant') {
        await db.transact(db.tx.messages[id()].update({
          content: message.content,
          createdAt: DateTime.now().toISO(),
          role: "assistant",
          model: selectedModel
        }).link({ conversation: conversationId as string }));
      }
    },
    onError: (error: Error) => {
      console.error('Error from useChat:', error);
      let displayError = `Error generating response. Please check API key/model and try again.`;
      try {
          if ((error as any)?.status === 401) {
             displayError = 'Error: Authentication failed. Please check your API key.';
          } else {
              const parsedError = JSON.parse(error.message);
              if (parsedError.error) {
                  displayError = `Error: ${parsedError.error}`;
              }
          }
      } catch (e) {
          if (error.message.length < 100) {
             displayError = `Error: ${error.message}`;
          }
      }
      setError(displayError);
    }
  });

  useEffect(() => {
    if (conversationData?.conversations[0]) {
      setConversation(conversationData.conversations[0]);
    }
  }, [conversationData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }
      if (e.key === 'k') {
        e.preventDefault();
        messageInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const messageContent = input.trim();
    if (!messageContent) return;

    if (!currentApiKey) {
      const provider = selectedModel.split('/')[0];
      setError(`⚠️ No API key found for ${provider}. Please [set up your API key](/settings/keys).`);
      db.transact(db.tx.messages[id()].update({
        content: `⚠️ No API key found for ${provider}. Please [set up your API key](/settings/keys) to continue the conversation.`,
        createdAt: DateTime.now().toISO(),
        role: "system",
        model: selectedModel
      }).link({ conversation: conversationId as string }));
      return;
    }

    setError(null);

    const userMessageId = id();
    const userMessageForDb = {
        content: messageContent,
        createdAt: DateTime.now().toISO(),
        role: "user" as const,
        model: selectedModel
    };

    const userMessageForHook: VercelAIMessage = {
      id: userMessageId,
      role: 'user',
      content: messageContent,
      createdAt: new Date()
    };

    try {
        await db.transact(
            db.tx.messages[userMessageId]
              .update(userMessageForDb)
              .link({ conversation: conversationId as string })
        );

        handleSubmit(e as React.FormEvent<HTMLFormElement>);

    } catch (dbError) {
        console.error("Failed to save user message to DB:", dbError);
        setError("Failed to send message. Could not save to database.");
    }
  };

  const getPlaceholder = useCallback(() => {
    const provider = selectedModel.split('/')[0] as keyof typeof providerKeys;
    return providerKeys[provider]
      ? "Type a message (Shift+Enter for newline)..."
      : `Please set your ${provider} API key first...`;
  }, [selectedModel, providerKeys]);

  const isSendDisabled = isLoading || !input.trim() || !currentApiKey;

  const handleSuggestionClick = (suggestion: string) => {
    if (!currentApiKey) {
      const provider = selectedModel.split('/')[0];
      setError(`⚠️ No API key found for ${provider}. Please [set up your API key](/settings/keys).`);
      return;
    }
    setInput(suggestion);
    setTimeout(() => {
       formRef.current?.requestSubmit();
    }, 0);
  };

  const relativeCreatedAt = useMemo(() => {
     const createdAtIso = conversation?.createdAt;
     if (typeof createdAtIso === 'string') {
         return DateTime.fromISO(createdAtIso).toRelative();
     }
     return '';
  }, [conversation?.createdAt]);

  const dbMessageModels = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    conversationData?.conversations?.[0]?.messages?.forEach((m: DBMessage) => {
      if (m.id) {
        map.set(m.id, m.model);
      }
    });
    return map;
  }, [conversationData]);

  return (
    <div className="w-full h-full flex flex-col relative bg-sage-1">
      <div className="flex flex-row w-full px-6 py-4 border-b border-sage-3 backdrop-blur-sm sticky top-0 z-10 bg-sage-1/80">
        <div className="flex flex-col">
          <h1 className="font-medium text-sage-12">{conversation?.name ?? 'Conversation'}</h1>
          <p className="text-xs text-sage-11 font-mono">
             {relativeCreatedAt}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-80">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.length > 0 ? (
            messages.map((message: VercelAIMessage) => {
              const model = dbMessageModels.get(message.id) ?? selectedModel;

              return (
                <MessageComponent
                  key={message.id}
                  message={{
                    id: message.id,
                    role: message.role,
                    content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                    createdAt: message.createdAt?.toISOString() ?? DateTime.now().toISO(),
                    model: model
                  }}
                  isStreaming={isLoading && message.role === 'assistant' && message.id === messages[messages.length - 1]?.id}
                />
              );
            })
          ) : !isLoading && (!conversationData || initialMessages.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
               <h2 className="text-xl font-medium text-sage-12">What's on your mind?</h2>
               <p className="text-sage-11 mb-8 text-sm font-mono">Here are some ideas to get started:</p>
              <div className="flex flex-wrap gap-2 w-full max-w-2xl items-center justify-center">
                {[
                  "What's your favorite book and why?",
                  "Can you help me plan a weekend trip?",
                  "What's a good recipe for dinner tonight?",
                  "Tell me about an interesting historical event"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-2 text-left text-sm rounded-lg border border-sage-3 hover:bg-sage-2 transition-colors text-sage-12"
                    disabled={isLoading || !currentApiKey}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                 <p className="text-sage-11">Loading messages...</p>
             </div>
          )}
           {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="text-center text-sage-11 text-sm mt-2">AI is thinking...</div>
           )}
        </div>
      </div>

      {/* Chat Input Section */}
      <div className="absolute bottom-8 w-1/2 inset-x-0 mx-auto overflow-hidden mt-20">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={(content) => {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
            handleFormSubmit(fakeEvent);
          }}
          isLoading={isLoading}
          error={error}
          placeholder={getPlaceholder()}
          selectedModel={selectedModel}
          models={models}
          onModelChange={setSelectedModel}
          disabled={!currentApiKey}
          loadingButtonText="Streaming..."
          submitButtonText="Send"
        />
      </div>
    </div>
  );
}