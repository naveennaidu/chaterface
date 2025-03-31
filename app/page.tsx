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
import IntroductionModal from "@/components/IntroductionModal";
import { AnimatePresence } from "motion/react";
import ChatInput from "@/components/ChatInput";

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
    if (typeof window !== 'undefined' && localStorage.getItem('hasSeenIntroModal') !== 'true') {
    // Temporarily always show modal for development
    // if (typeof window !== 'undefined') {
      setShowIntroModal(true);
    }
    messageInputRef.current?.focus();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleCloseModal = () => {
    setShowIntroModal(false);
    // Ensure localStorage is accessed only on the client side
    if (typeof window !== 'undefined') {
       localStorage.setItem('hasSeenIntroModal', 'true');
    }
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
    <div className="w-full h-screen flex flex-col relative bg-sage-1 items-center justify-center">
      <AnimatePresence>
        {showIntroModal && (
          <IntroductionModal isOpen={showIntroModal} onClose={handleCloseModal} />
        )}
      </AnimatePresence>

      {/* Placeholder for message area - could add suggestions or instructions */}
      <div className="overflow-y-auto px-4 pt-6 flex items-center justify-center">
         <div className="text-center">
             <h2 className="text-xl font-medium text-sage-12">What's on your mind?</h2>
             <p className="text-sage-11 text-sm font-mono mt-1">Send a message to start a new conversation.</p>
         </div>
      </div>

      {/* Chat Input Section */}
      <div className="w-1/2 inset-x-0 mx-auto overflow-hidden mt-20">
        <ChatInput
          input={content}
          setInput={setContent}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          error={error}
          placeholder={getPlaceholder()}
          selectedModel={selectedModel}
          models={models}
          onModelChange={setSelectedModel}
          disabled={!providerKeys[currentProvider]}
          loadingButtonText="Creating..."
          submitButtonText="Send"
        />
      </div>
    </div>
  );
}
