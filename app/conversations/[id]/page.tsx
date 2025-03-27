'use client';

import { useDatabase } from "@/app/providers/database-provider";
import { useKey } from "@/app/providers/key-provider";
import { AppSchema } from "@/instant.schema";
import { InstaQLEntity } from "@instantdb/react";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import Button from "@/components/button";
import { useParams } from "next/navigation";
import { id } from "@instantdb/react";
import Message from "@/components/message";
import generateResponse from "@/services/generate-response";
import ApiKeyInput from "@/components/api-key-input";

export default function ConversationPage() {
  const { db } = useDatabase();
  const { providerKeys } = useKey();
  const [conversation, setConversation] = useState<InstaQLEntity<AppSchema, "conversations", {messages: object}> | null>(null);
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (providerKeys.openai) return 'openai/gpt-4o';
    if (providerKeys.anthropic) return 'anthropic/claude-3-5-sonnet';
    if (providerKeys.google) return 'google/gemini-2.0-flash';
    return 'openai/gpt-4o';
  });
  const [error, setError] = useState<string | null>(null);

  const { id: conversationId } = useParams();
  const { data } = db.useQuery({
    conversations: {
      $: { where: { id: conversationId as string } },
      messages: {}
    }
  });

  const models = [
    { id: 'openai/gpt-4o', name: 'gpt-4o' },
    { id: 'openai/gpt-4o-mini', name: 'gpt-4o-mini' },
    { id: 'anthropic/claude-3-5-sonnet', name: 'claude-3-5-sonnet' },
    { id: 'anthropic/claude-3-7-sonnet', name: 'claude-3-7-sonnet' },
    { id: 'google/gemini-2.0-flash', name: 'gemini-2.0-flash' },
  ];

  useEffect(() => {
    if (data?.conversations[0]) {
      setConversation(data.conversations[0]);
    }
  }, [data]);

  const createMessage = async (content: string) => {
    setError(null);
    
    // Get the provider from the selected model
    const provider = selectedModel.split('/')[0] as 'openai' | 'anthropic' | 'google';
    const apiKey = providerKeys[provider];
    
    if (!apiKey) {
      setError(`Please set your ${provider} API key first`);
      return;
    }

    // Create user message
    await db.transact(db.tx.messages[id()].update({
      content,
      createdAt: DateTime.now().toISO(),
      role: "user",
      model: selectedModel
    }).link({conversation: conversationId as string}));

    // Start streaming response
    setIsStreaming(true);
    setStreamingMessageId(null);
    
    try {
      const textStream = await generateResponse(conversationId as string, selectedModel, apiKey);
      let fullResponse = '';
      let messageId: string | null = null;
      
      for await (const textPart of textStream) {
        fullResponse += textPart;
        
        // Create message on first chunk if not exists
        if (!messageId) {
          messageId = id();
          setStreamingMessageId(messageId);
          await db.transact(db.tx.messages[messageId].update({
            content: fullResponse,
            createdAt: DateTime.now().toISO(),
            role: "assistant",
            model: selectedModel
          }).link({conversation: conversationId as string}));
        } else {
          // Update existing message with new content
          await db.transact(db.tx.messages[messageId].update({
            content: fullResponse,
          }));
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      setError('Error generating response. Please check your API key and try again.');
      if (streamingMessageId) {
        await db.transact(db.tx.messages[streamingMessageId].update({
          content: 'Sorry, there was an error generating the response.'
        }));
      }
    } finally {
      setIsStreaming(false);
      setStreamingMessageId(null);
    }

    setContent('');
  }

  // Get the current provider from the selected model
  const currentProvider = selectedModel.split('/')[0];

  const getPlaceholder = () => {
    const provider = selectedModel.split('/')[0] as keyof typeof providerKeys;
    if (providerKeys[provider]) {
      return "Type a message...";
    }
    return `Please set your ${provider} API key first...`;
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-sage-1">
      <div className="flex flex-row w-full px-6 py-4 border-b border-sage-3 backdrop-blur-sm">
        <div className="flex flex-col">
          <h1 className="font-medium text-sage-12">{conversation?.name}</h1>
          <p className="text-xs text-sage-11 font-mono">{DateTime.fromISO(conversation?.createdAt as string).toRelative()}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-80">
        <div className="max-w-3xl mx-auto space-y-2">
          {conversation?.messages && conversation?.messages.map((message: InstaQLEntity<AppSchema, "messages">) => (
            <Message 
              key={message.id} 
              message={message} 
              isStreaming={message.id === streamingMessageId}
            />
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-0 border-t border-sage-3 w-full shadow-lg bg-sage-1">
        <div className="backdrop-blur-sm max-w-3xl mx-auto border-x border-sage-3 overflow-hidden">
          {error && (
            <div className="px-4 py-2 text-sm text-red-500 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}
          <div className="flex flex-row">
            <textarea 
              className="w-full bg-transparent outline-none p-4 text-sm resize-none min-h-[60px] max-h-[200px] text-sage-12 placeholder:text-sage-11" 
              placeholder={getPlaceholder()} 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              disabled={isStreaming || !providerKeys[currentProvider as keyof typeof providerKeys]}
            />
          </div>
          <div className="flex flex-row p-2 pb-6 justify-between items-center border-t border-sage-3">
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-4">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="text-sm bg-sage-3 text-sage-12 border border-sage-4 rounded-md px-2 py-1 outline-none hover:bg-sage-4 transition-colors"
                  disabled={isStreaming}
                >
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                {currentProvider === 'openai' && (
                  <ApiKeyInput provider="openai" label="OpenAI API Key" />
                )}
                {currentProvider === 'anthropic' && (
                  <ApiKeyInput provider="anthropic" label="Anthropic API Key" />
                )}
                {currentProvider === 'google' && (
                  <ApiKeyInput provider="google" label="Google API Key" />
                )}
              </div>
            </div>

            <Button 
              onClick={() => createMessage(content)} 
              size="small" 
              className="ml-4 bg-sage-3 hover:bg-sage-4 text-sage-12 border border-sage-4 shadow-sm transition-colors"
              disabled={isStreaming || !content.trim() || !providerKeys[currentProvider as keyof typeof providerKeys]}
            >
              {isStreaming ? 'Streaming...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}