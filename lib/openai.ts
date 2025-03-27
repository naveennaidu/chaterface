import { openai } from '@ai-sdk/openai';

export function createOpenAIClient(model: string, apiKey: string) {
  return openai(model as any, {
    apiKey,
  });
} 