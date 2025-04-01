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
    const generatedNewMessageId = id();
    const generatedNewConversationId = id();

    setNewConversationMessage(content);
    setNewConversationId(generatedNewConversationId);

    // create conversation
    await db.transact(db.tx.conversations[generatedNewConversationId].update({
      createdAt: DateTime.now().toISO(),
      name: "New Conversation"
    }));

    // // Create initial user message
    // await db.transact(db.tx.messages[generatedNewMessageId].update({
    //   content: content,
    //   createdAt: DateTime.now().toISO(),
    //   role: "user",
    //   model: selectedModel ?? "openai/gpt-4o"
    // }).link({ conversation: generatedNewConversationId}));

    return generatedNewConversationId;
  }

  const handleNewMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (input.trim()) {
      const newConversationId = await createMessage(input);
      router.push(`/conversations/${newConversationId}`);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }

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

      <div
      className="px-4 bg-gradient-to-t from-white to-transparent via-50% via-white/80 absolute bottom-0 w-full py-8"
      >
        <div className="mx-auto max-w-xl bg-white shadow-xl border border-sage-3 rounded-xl">
          <form onSubmit={
            async (e) => {
              e.preventDefault();
              handleNewMessage(e as any);
            }
          } className="w-full">
            <input
              className="w-full p-4 border-b border-sage-3 focus:outline-none focus:ring-0 resize-none text-sm"
              value={input}
              placeholder="Say something..."
              onChange={handleInputChange}
            />
          </form>
          <div className="flex justify-between items-center p-2">
            <button 
              className="text-sage-600 ml-auto bg-sage-1 px-2 py-1 text-sm flex items-center gap-2 rounded-md border border-sage-3 hover:bg-sage-2 transition-colors cursor-pointer" 
              onClick={handleNewMessage}
            >
              {/* <PaperPlaneTilt size={16} weight="fill" /> */}
              <p className="text-sm">Send Message</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
