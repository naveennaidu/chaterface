import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model, apiKey } = await req.json();

  // Set the API key in the environment
  process.env.OPENAI_API_KEY = apiKey;

  try {
    const { textStream } = await streamText({
      model: openai(model),
      messages: messages
    });

    return new Response(textStream);
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 