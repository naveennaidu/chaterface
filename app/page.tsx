'use client';

import { useState, useRef, useEffect } from "react";
import { useDatabase } from "@/providers/database-provider";
import { useKey } from "@/providers/key-provider";
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
import NewMessageInput from "@/components/new-message-input";
import { useNewConversation } from "@/providers/new-conversation-provider";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@/providers/auth-provider";
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
  const [input, setInput] = useState<string>('');
  const { sessionId } = useAuth();
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

  const { newConversationMessage, setNewConversationMessage, setNewConversationId } = useNewConversation();

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

  // Get the current provider from the selected model
  const currentProvider = selectedModel.split('/')[0] as keyof typeof providerKeys;

  const getPlaceholder = () => {
    if (!providerKeys[currentProvider]) {
      return `Please set your ${currentProvider} API key first...`;
    }
    return "Start a new chat...";
  };

  async function createMessage(content: string) {
    const generatedNewConversationId = id();

    setNewConversationMessage(content);
    setNewConversationId(generatedNewConversationId);

    // create conversation
    await db.transact(db.tx.conversations[generatedNewConversationId].update({
      createdAt: DateTime.now().toISO(),
      name: content.slice(0, 20).trim(),
      sessionId: sessionId as string
    }));

    router.push(`/conversations/${generatedNewConversationId}`);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }

  return (
    <div className="w-full h-screen flex flex-col relative items-center justify-center">
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

      
      <NewMessageInput input={input} handleInputChange={handleInputChange} createMessage={createMessage} selectedModel={selectedModel} setSelectedModel={setSelectedModel} onHomepage={true} />
    </div>
  );
}
