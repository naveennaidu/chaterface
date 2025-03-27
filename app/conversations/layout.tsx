'use client';

import Button from "@/components/button";
import Logo from "@/components/logo";
import { Plus } from "@phosphor-icons/react";
import { useAuth } from "../providers/auth-provider";
import { useDatabase } from "../providers/database-provider";
import { useEffect, useState, useRef } from "react";
import { id } from "@instantdb/react";
import { DateTime } from "luxon";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import hotkeys from 'hotkeys-js';
import { useCreateConversation } from "../utils/conversation";

interface Conversation {
  id: string;
  name: string;
  createdAt: Date;
  sessionId: string;
}

export default function ConversationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { sessionId } = useAuth();
  const { db } = useDatabase();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { createConversationAndRedirect } = useCreateConversation();

  const conversationId = pathname.split('/').pop();

  const { data } = db.useQuery({
    conversations: {
      $: {
        where: {
          sessionId: sessionId ?? '',
        }
      }
    }
  });

  useEffect(() => {
    if (data?.conversations) {
      const formattedConversations = data.conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt)
      }));
      setConversations(formattedConversations);
    }
  }, [data]);

  // Set up keyboard shortcuts
  useEffect(() => {
    // Create new conversation
    hotkeys('n', (event) => {
      // Only trigger if not in a textarea or input
      if (!(event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        createConversationAndRedirect();
      }
    });

    // Clean up hotkeys on unmount
    return () => {
      hotkeys.unbind('n');
    };
  }, [createConversationAndRedirect]);

  return (
    <div className="flex flex-row h-dvh w-full overflow-hidden bg-sage-2">
      <div className="flex flex-col p-2 overflow-y-auto items-start w-full max-w-64">
        <Logo style="small" className="my-2"/>
        <Button onClick={createConversationAndRedirect} size="small" className=" mt-2 w-full bg-sage-1 text-sage-12 hover:shadow-none border border-sage-4 hover:bg-sage-3 duration-300" icon={<Plus size={16} weight="bold" />}>New Conversation</Button>

        <div className="gap-2 flex flex-col w-full mt-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <p className="text-xs font-mono px-2">Conversations</p>
            <p className="text-xs font-mono px-2"> {conversations.length} </p>
          </div>
          <div className="flex flex-col w-full gap-px">
            {conversations.map(conv => (
              <Link key={conv.id} href={`/conversations/${conv.id}`} className={`text-sm px-2 py-1 rounded-md hover:bg-sage-3 duration-300 ${conv.id === conversationId ? 'bg-sage-4' : ''}`}>{conv.name}</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full border border-sage-3 bg-sage-1 mx-2 my-2 rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}
