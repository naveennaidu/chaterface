import { streamText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export async function POST(req: Request) {
  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Get messages, model, and conversationId from the body
    const { messages, model }: { messages: CoreMessage[], model: string } = await req.json();

    // Ensure required body data is present
    if (!messages || !model) {
      return new Response(JSON.stringify({ error: 'Missing required fields in body (messages, model)' }), {
         status: 400,
         headers: { 'Content-Type': 'application/json' }
      });
    }

    const [provider, modelId] = model.split('/');

    let result;

    console.log("provider", provider);

    // Use the extracted apiKey
    switch (provider) {
      case 'openai':
        const openaiClient = createOpenAI({ apiKey }); // Use extracted key
        result = await streamText({ model: openaiClient(modelId), messages: messages });
        return result.toDataStreamResponse();

      case 'anthropic':
        const anthropicClient = createAnthropic({ apiKey }); // Use extracted key
        result = await streamText({ model: anthropicClient(modelId), messages: messages });
        return result.toDataStreamResponse();

      case 'google':
        const googleClient = createGoogleGenerativeAI({ apiKey }); // Use extracted key
        result = await streamText({ model: googleClient(modelId), messages: messages });
        return result.toDataStreamResponse();

      default:
        console.error(`Unsupported provider: ${provider}`);
        return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error: any) {
    console.error("Error in chat API route:", error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    const errorMessage = error.message || 'An unexpected error occurred';
    const errorStatus = error.status || error.statusCode || 500;
    return new Response(JSON.stringify({ error: errorMessage }), {
        status: errorStatus,
        headers: { 'Content-Type': 'application/json' }
    });
  }
} 