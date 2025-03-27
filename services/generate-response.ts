'use server';

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { db } from '@/lib/instant-admin';
import { OpenAIChatModelId } from '@ai-sdk/openai/internal';

export default async function generateResponse(conversationId: string, model: string, apiKey: string) {
  const messages = await getConversationMessages(conversationId);
  const [provider, modelId] = model.split('/');

  switch (provider) {
    case 'openai':
      const openaiClient = createOpenAI({ apiKey });
      const { textStream } = streamText({
        model: openaiClient(modelId as OpenAIChatModelId),
        messages: messages
      });
      return textStream;

    case 'anthropic':
      const anthropicClient = createAnthropic({ apiKey });
      const { textStream: anthropicStream } = streamText({
        model: anthropicClient(modelId),
        messages: messages
      });
      return anthropicStream;

    case 'google':
      const googleClient = createGoogleGenerativeAI({ apiKey });
      const { textStream: googleStream } = streamText({
        model: googleClient(modelId),
        messages: messages
      });
      return googleStream;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function getConversationMessages(conversationId: string) {
  const messages: {role: 'user' | 'assistant', content: string}[] = [];

  const conversation = await db.query({
    conversations: {
      $: {
        where: {
          id: conversationId,
        },
      },
      messages: {
      },
    },
  }).then((res: any) => res.conversations[0]);

  for (const message of conversation?.messages) {
    messages.push({role: message.role, content: message.content});
  }

  return messages;
}