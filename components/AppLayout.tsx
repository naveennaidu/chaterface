'use client';

import Button from "@/components/button";
import Logo from "@/components/logo";
import { Plus, Gear } from "@phosphor-icons/react";
import { useAuth } from "@/providers/auth-provider"; // Adjusted path
import { useDatabase } from "@/providers/database-provider"; // Adjusted path
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import hotkeys from 'hotkeys-js';
import { useCreateConversation } from "@/app/utils/conversation"; // Adjusted path
import { AppSchema } from "@/instant.schema"; // Added import for AppSchema
import { InstaQLEntity } from "@instantdb/react"; // Added import for InstaQLEntity

// Define the expected shape of a conversation based on AppSchema
type Conversation = InstaQLEntity<AppSchema, "conversations">;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { sessionId } = useAuth();
  const { db } = useDatabase();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pathname = usePathname();
  const { createConversationAndRedirect } = useCreateConversation();

  // Determine the active conversation ID from the pathname
  const conversationId = pathname.startsWith('/conversations/') ? pathname.split('/').pop() : null;

  // Fetch conversations associated with the current session
  const { data } = db.useQuery({
    conversations: {
      $: {
        where: {
          sessionId: sessionId ?? '',
        },
        orderBy: { createdAt: "desc" } // Order by creation date, newest first
      }
    }
  });

  useEffect(() => {
    if (data?.conversations) {
      // No need to map createdAt to Date, keep as ISO string from DB
      setConversations(data.conversations as Conversation[]);
    }
  }, [data]);

  // Set up keyboard shortcuts
  useEffect(() => {
    // Shortcut 'n' to create a new conversation
    hotkeys('n', (event) => {
      // Prevent triggering shortcut if focus is inside an input or textarea
      if (!(event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        createConversationAndRedirect();
      }
    });

    // Cleanup function to unbind the shortcut when the component unmounts
    return () => {
      hotkeys.unbind('n');
    };
  }, [createConversationAndRedirect]); // Dependency array ensures effect runs only when the function changes

  return (
    <div className="flex flex-row h-dvh w-full overflow-hidden bg-sage-2">
      {/* Sidebar */}
      <div className="flex flex-col p-2 overflow-y-auto items-start w-full max-w-64 border-sage-4">
        <Logo style="small" className="my-2 ml-1"/>
        <Button href="/settings/keys" size="small" className="mt-2 w-full bg-sage-1 text-sage-12 hover:shadow-none border border-sage-4 hover:bg-sage-3 duration-300" icon={<Gear size={16} weight="bold" />}>Settings</Button>
        <Button onClick={createConversationAndRedirect} size="small" className="mt-2 w-full bg-sage-1 text-sage-12 hover:shadow-none border border-sage-4 hover:bg-sage-3 duration-300" icon={<Plus size={16} weight="bold" />}>New Conversation</Button>

        {/* Conversation List */}
        <div className="gap-2 flex flex-col w-full mt-4 flex-1 overflow-y-auto">
          <div className="flex flex-row items-center justify-between gap-2 sticky top-0 bg-sage-2 pb-1">
            <p className="text-xs font-mono px-2">Conversations</p>
            <p className="text-xs font-mono px-2"> {conversations.length} </p>
          </div>
          <div className="flex flex-col w-full gap-px">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className={`text-sm px-2 py-1 rounded-md hover:bg-sage-3 duration-300 truncate ${conv.id === conversationId ? 'bg-sage-4 font-medium text-sage-12' : 'text-sage-11'}`}
                title={conv.name} // Show full name on hover
              >
                {conv.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full bg-sage-1 mx-2 my-2 rounded-lg overflow-hidden border border-sage-4">
        {children}
      </div>
    </div>
  );
} 