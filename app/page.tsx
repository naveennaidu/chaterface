'use client';

import { useState, useRef, useEffect } from "react";
import { useDatabase } from "@/app/providers/database-provider";
import { useKey } from "@/app/providers/key-provider";
import { useRouter } from 'next/navigation';
import { DateTime } from "luxon";
import { id } from "@instantdb/react";
import Button from "@/components/button";
import ApiKeyInput from "@/components/api-key-input";
import Logo from "@/components/logo";
import { Lora } from "next/font/google";
import HyperaideLogo from "@/components/misc/hyperaide-logo";
import { GithubLogo, ChatTeardropDots, Gear } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  const { db } = useDatabase();
  const { providerKeys } = useKey();
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // Changed from isStreaming for clarity
  const [selectedModel, setSelectedModel] = useState(() => {
    // Default model selection logic based on available keys
    if (providerKeys.openai) return 'openai/gpt-4o';
    if (providerKeys.anthropic) return 'anthropic/claude-3-5-sonnet';
    if (providerKeys.google) return 'google/gemini-2.0-flash';
    return 'openai/gpt-4o'; // Fallback default
  });
  const [error, setError] = useState<string | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [showIntroModal, setShowIntroModal] = useState(false); // State for modal visibility

  const models = [
    { id: 'openai/gpt-4o', name: 'gpt-4o' },
    { id: 'openai/gpt-4o-mini', name: 'gpt-4o-mini' },
    { id: 'anthropic/claude-3-5-sonnet', name: 'claude-3-5-sonnet' },
    { id: 'anthropic/claude-3-7-sonnet', name: 'claude-3-7-sonnet' },
    { id: 'google/gemini-2.0-flash', name: 'gemini-2.0-flash' },
  ];

  // Check localStorage on mount to decide if modal should show
  useEffect(() => {
    // Ensure localStorage is accessed only on the client side
    // if (typeof window !== 'undefined' && localStorage.getItem('hasSeenIntroModal') !== 'true') {
    // Temporarily always show modal for development
    if (typeof window !== 'undefined') {
      setShowIntroModal(true);
    }
    messageInputRef.current?.focus();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleCloseModal = () => {
    setShowIntroModal(false);
    // Ensure localStorage is accessed only on the client side
    // if (typeof window !== 'undefined') {
    //    localStorage.setItem('hasSeenIntroModal', 'true');
    // }
  };

  const handleSendMessage = async () => {
    if (!content.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);

    const provider = selectedModel.split('/')[0] as 'openai' | 'anthropic' | 'google';
    const apiKey = providerKeys[provider];

    if (!apiKey) {
      setError(`Please set your ${provider} API key first.`);
      setIsLoading(false);
      return;
    }

    const newConversationId = id();
    const newMessageId = id();
    const now = DateTime.now().toISO();
    // Generate a simple name for the conversation from the first message
    const conversationName = content.trim().split(' ').slice(0, 5).join(' ') + (content.trim().split(' ').length > 5 ? '...' : '');

    try {
      await db.transact([
        // Create the conversation
        db.tx.conversations[newConversationId].update({
          name: conversationName,
          createdAt: now,
          // Add any other default fields for conversation if needed
        }),
        // Create the first user message and link it
        db.tx.messages[newMessageId].update({
          content: content.trim(),
          createdAt: now,
          role: "user",
          model: selectedModel
        }).link({ conversation: newConversationId })
      ]);

      // Clear content and navigate
      setContent('');
      router.push(`/conversations/${newConversationId}`);

    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get the current provider from the selected model
  const currentProvider = selectedModel.split('/')[0] as keyof typeof providerKeys;

  const getPlaceholder = () => {
    if (!providerKeys[currentProvider]) {
      return `Please set your ${currentProvider} API key first...`;
    }
    return "Start a new chat...";
  };

  return (
    <div className="w-full h-screen flex flex-col relative bg-sage-1">

      {/* Introduction Modal */}
      {showIntroModal && (
        <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
          <div className="bg-sage-2 p-2 rounded-xl better-shadow max-w-xl w-full border border-sage-4">
          <div
          className="flex flex-col w-full relative overflow-hidden rounded-lg"
          style={{
            backgroundImage: "url('/hero-noise.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full">
            <div className="flex flex-row items-center w-full max-w-7xl mx-auto pt-8 pb-4 justify-between">
              <div className="flex flex-row items-center w-max mx-auto gap-4">
                <Logo color="white"/>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-4 pb-40 px-4">
            <h1 className={`${lora.className} text-2xl font-semibold text-sage-1 relative z-10`}>Your Interface to Intelligence</h1>
            <p className={`text-sm text-sage-5 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>

            {/* <div className="flex flex-row items-center gap-2 mx-auto w-max mt-4">
              <Button href="/" className="bg-sage-12/50 text-sage-2 hover:shadow-none hover:bg-sage-12 duration-300" icon={<GithubLogo size={16} weight="bold" />}>View on GitHub</Button>
              <Button href="/" className="bg-sage-12 text-sage-2 hover:shadow-none hover:bg-sage-12/85 duration-300" icon={<ChatTeardropDots size={16} weight="bold" />}>Try it out</Button>
            </div> */}
          </div>
            </div>

          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 px-2 pb-2">
            {/* Open Source Card */}
            <div className="flex flex-col gap-1 bg-sage-3 border border-sage-4 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                 <GithubLogo size={18} weight="bold" className="text-sage-11"/>
                <h3 className="text-base font-semibold text-sage-12">Open Source</h3>
              </div>
              <p className="text-sm text-sage-11">
                Chaterface is fully open-source on GitHub. Feel free to inspect, modify, and contribute.
              </p>
              {/* <Button size="small" href="https://github.com/hyperaide/chaterface" className="mt-2 bg-sage-4 hover:bg-sage-5 text-sage-12 border border-sage-6" icon={<GithubLogo size={14} weight="bold" />}>View on GitHub</Button> */}
            </div>

            {/* Multi-Model Card */}
            <div className="flex flex-col gap-1 bg-sage-3 border border-sage-4 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                 <ChatTeardropDots size={18} weight="bold" className="text-sage-11"/>
                 <h3 className="text-base font-semibold text-sage-12">Unified Interface</h3>
              </div>
              <p className="text-sm text-sage-11">
                Access leading models from OpenAI, Anthropic, and Google all in one consistent chat interface.
              </p>
            </div>

            {/* Local Keys Card */}
            <div className="flex flex-col gap-1 bg-sage-3 md:col-span-2 border border-sage-4 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                 <Gear size={18} weight="bold" className="text-sage-11"/>
                 <h3 className="text-base font-semibold text-sage-12">Secure & Private</h3>
              </div>
              <p className="text-sm text-sage-11 mb-2">
                Your API keys are stored securely only in your browser's local storage. No sign-up needed, no data leaves your machine.
              </p>
              <Button size="small" href="/settings/keys" className="mt-auto bg-sage-4 hover:bg-sage-5 text-sage-12 border border-sage-6 duration-100" icon={<Gear size={14} weight="bold" />}>Manage API Keys</Button>
            </div>

          </div>
          </div>
        </div>
      )}

      {/* Placeholder for message area - could add suggestions or instructions */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-80 flex items-center justify-center">
         <div className="text-center">
             <h2 className="text-xl font-medium text-sage-12">What's on your mind?</h2>
             <p className="text-sage-11 text-sm font-mono mt-1">Enter your first message below to start a conversation.</p>
         </div>
      </div>

      {/* Chat Input Section */}
      <div className="absolute bottom-0 border-t border-sage-3 w-full shadow-lg bg-sage-1">
        <div className="backdrop-blur-sm max-w-3xl mx-auto border-x border-sage-3 overflow-hidden">
          {error && (
            <div className="px-4 py-2 text-sm text-red-500 bg-red-50 border-b border-red-100">
              {error}
            </div>
          )}
          <div className="flex flex-row">
            <textarea
              ref={messageInputRef}
              className="w-full bg-transparent outline-none p-4 text-sm resize-none min-h-[60px] max-h-[200px] text-sage-12 placeholder:text-sage-11"
              placeholder={getPlaceholder()}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || !providerKeys[currentProvider]}
            />
          </div>
          <div className="flex flex-row p-2 pb-2 justify-between items-center border-t border-sage-3">
            <div className="flex flex-col gap-4 flex-1">
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
            </div>

            <Button
              onClick={handleSendMessage}
              size="small"
              className="ml-4 bg-sage-3 hover:bg-sage-4 text-sage-12 border border-sage-4 shadow-sm transition-colors"
              disabled={isLoading || !content.trim() || !providerKeys[currentProvider]}
            >
              {isLoading ? 'Creating...' : 'Send'}
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t border-sage-3">
            {/* Conditionally render API Key inputs based on selected model's provider */}
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
      </div>
    </div>
  );
}
