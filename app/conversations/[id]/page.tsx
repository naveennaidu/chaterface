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
      const currentConversation = conversationData.conversations[0];
      setConversation(currentConversation);

      const dbMessages = currentConversation.messages
        ?.map((m: DBMessage) => ({
          id: m.id,
          role: m.role as VercelAIMessage['role'],
          content: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : undefined
        }))
        .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
        || [];

      if (JSON.stringify(dbMessages) !== JSON.stringify(messages)) {
        setMessages(dbMessages);
      }
    }
  }, [conversationData, setMessages, messages]);

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
            messages.map((message: VercelAIMessage) => (
              <MessageComponent
                key={message.id}
                message={{
                    id: message.id,
                    role: message.role,
                    content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                    createdAt: message.createdAt?.toISOString() ?? DateTime.now().toISO(),
                    model: selectedModel
                }}
                isStreaming={isLoading && message.role === 'assistant' && message.id === messages[messages.length - 1]?.id}
              />
            ))
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
      <div className="absolute bottom-0 border-t border-sage-3 w-full bg-sage-1">
        <div className="max-w-3xl mx-auto border-x border-sage-3 overflow-hidden">
          {error && (
            <div className="px-4 py-2 text-sm text-red-500 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}
          <form ref={formRef} onSubmit={handleFormSubmit}>
            <div className="flex flex-row">
              <textarea
                ref={messageInputRef}
                className="w-full bg-transparent outline-none p-4 text-sm resize-none min-h-[60px] max-h-[200px] text-sage-12 placeholder:text-sage-11"
                placeholder={getPlaceholder()}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                disabled={isLoading || !currentApiKey}
                rows={1}
              />
            </div>
            <div className="flex flex-row p-2 pb-2 justify-between items-center border-t border-sage-3">
              <div className="flex items-center gap-4">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-sm bg-sage-3 text-sage-12 border border-sage-4 rounded-md px-2 py-1 outline-none hover:bg-sage-4 transition-colors"
                  disabled={isLoading}
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="small"
                className="bg-sage-3 hover:bg-sage-4 text-sage-12 border border-sage-4 transition-colors"
                disabled={isSendDisabled}
              >
                 {isLoading ? (
                   <span className="flex items-center gap-1">
                     <svg className="animate-spin h-4 w-4 text-sage-11" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Streaming...
                   </span>
                 ) : 'Send'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}