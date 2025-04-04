'use client';

import Button from "@/components/button";
import Logo from "@/components/logo";
import { Plus, Gear, MoonStars, Sun, ArrowRight, List, X } from "@phosphor-icons/react";
import { useAuth } from "@/providers/auth-provider";
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

// Helper function to get a cookie value by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null; // Return null if document is not available (server-side)
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue ? decodeURIComponent(cookieValue) : null; // Decode URI component
  }
  return null;
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, signOut } = useAuth();
  const { db } = useDatabase();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pathname = usePathname();
  const { createConversationAndRedirect } = useCreateConversation();

  // Determine the active conversation ID from the pathname
  const conversationId = pathname.startsWith('/conversations/') ? pathname.split('/').pop() : null;

  // Fetch conversations associated with the current user
  const { data } = db.useQuery({
    conversations: {
      $: {
        where: {
          userId: user?.id ?? '',
        },
        order: { createdAt: "desc" }
      },
    },
  }, { ruleParams: { userId: user?.id ?? '' } });

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

    return () => {
      hotkeys.unbind('n');
    };
  }, [createConversationAndRedirect]);

  // --- Theme State ---
  // Initialize theme, default to 'light'. We'll check cookie client-side.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Effect to read theme from cookie on component mount (client-side only)
  useEffect(() => {
    const savedTheme = getCookie('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to auto-close sidebar on mobile when navigating to a conversation
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Set cookie to expire in 1 year
    document.cookie = `theme=${newTheme};path=/;max-age=31536000;SameSite=Lax`;
  };
  // --- End Theme State ---

  return (
    <div className={`flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-sage-2 dark:bg-sage-1 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-2 border-b border-sage-4 dark:border-sage-5 bg-sage-2 dark:bg-sage-1 z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-sage-3 dark:hover:bg-sage-4"
            aria-label="Toggle sidebar"
          >
            <List size={20} weight="bold" className="text-sage-11 dark:text-sage-11" />
          </button>
          <Logo style="small" className="ml-1" color={theme === 'dark' ? 'white' : 'black'} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-sage-3 dark:hover:bg-sage-4 rounded-md group transition-colors duration-300"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <MoonStars size={18} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
            ) : (
              <Sun size={18} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
            )}
          </button>
          <Link href="/settings/keys" className="p-2 hover:bg-sage-3 dark:hover:bg-sage-4 rounded-md group transition-colors duration-300">
            <Gear size={18} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
          </Link>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'fixed left-0 top-0 bottom-0 z-30 w-72' : 'hidden'} 
        md:relative md:flex md:w-64 md:max-w-64 md:z-auto
        flex-col p-2 overflow-y-auto items-start bg-sage-2 dark:bg-sage-1 h-full
      `}>
        {/* Sidebar header - desktop */}
        <div className="hidden md:flex flex-row gap-2 mx-2 justify-between w-full items-center">
          <Logo style="small" className="my-2 ml-1" color={theme === 'dark' ? 'white' : 'black'}/>
          
          <div className="flex flex-row gap-1">
            <button
              onClick={toggleTheme}
              className="p-1 hover:bg-sage-3 dark:hover:bg-sage-4 rounded-md group transition-colors duration-300"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                  <MoonStars size={16} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
              ) : (
                  <Sun size={16} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
              )}
            </button>

            <Link href="/settings/keys" className="p-1 hover:bg-sage-3 dark:hover:bg-sage-4 rounded-md group transition-colors duration-300">
              <Gear size={16} weight="bold" className="text-sage-10 group-hover:text-sage-12 dark:text-sage-9 dark:group-hover:text-sage-11 transition-colors duration-300" />
            </Link>
          </div>
        </div>
        {/* Mobile sidebar header with close button */}
        <div className="md:hidden flex items-center justify-between w-full mb-4 pt-2">
          <Logo style="small" className="ml-1" color={theme === 'dark' ? 'white' : 'black'}/>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 hover:bg-sage-3 dark:hover:bg-sage-4 rounded-md"
          >
            <X size={20} weight="bold" className="text-sage-11 dark:text-sage-11" />
          </button>
        </div>

        <Button 
          onClick={() => {
            createConversationAndRedirect();
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }} 
          size="small" 
          className="mt-2 w-full bg-sage-3 text-sage-11 hover:bg-sage-4 dark:bg-sage-3 dark:text-sage-11 dark:hover:bg-sage-4 duration-300 border border-sage-6 dark:border-sage-6" 
          icon={<Plus size={16} weight="bold" />}
        >
          New Conversation
        </Button>

        {/* Conversation List */}
        <div className="gap-2 flex flex-col w-full mt-4 flex-1 overflow-y-auto">
          <div className="flex flex-row items-center justify-between gap-2 sticky top-0 bg-sage-2 dark:bg-sage-1 pb-1">
            <p className="text-xs font-mono px-2 text-sage-11 dark:text-sage-11">Conversations</p>
            <p className="text-xs font-mono px-2 text-sage-11 dark:text-sage-11"> {conversations.length} </p>
          </div>
          <div className="flex flex-col w-full gap-px">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/conversations/${conv.id}`}
                className={`text-sm px-2 py-2 md:py-1 rounded-md hover:bg-sage-3 dark:hover:bg-sage-4 duration-300 truncate ${conv.id === conversationId ? 'bg-sage-4 dark:bg-sage-5 font-medium text-sage-12 dark:text-sage-12' : 'text-sage-11 dark:text-sage-11'}`}
                title={conv.name}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
              >
                {conv.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-full mt-auto gap-2 py-4 border-t border-sage-4 dark:border-sage-5">
          {user ? (
            <>
              <div className="flex flex-row items-center gap-2 px-2 py-1">
                <div className="w-6 h-6 rounded-full bg-sage-5 dark:bg-sage-6 flex items-center justify-center">
                  <span className="text-xs font-medium text-sage-12 dark:text-sage-12">
                    {user.email?.[0] || '?'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-sage-12 dark:text-sage-12 line-clamp-1">
                    {user.email || 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="flex flex-row items-center gap-1 group mx-2 px-2 py-1 rounded-md hover:bg-sage-3 dark:hover:bg-sage-4 transition-colors duration-300"
              >
                <p className="text-xs font-medium text-sage-11 dark:text-sage-11 group-hover:text-sage-12 transition-colors duration-300">Logout</p>
                <ArrowRight size={12} weight="bold" className="text-sage-11 dark:text-sage-11 group-hover:text-sage-12 transition-colors duration-300" />
              </button>
            </>
          ) : (
            <div className="flex flex-row items-center gap-1 px-2 py-1">
              <p className="text-xs font-mono text-sage-11 dark:text-sage-11">Not logged in</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 bg-white dark:bg-sage-2 mx-2 my-2 rounded-lg overflow-hidden border border-sage-4 dark:border-sage-5">
        {children}
      </div>
    </div>
  );
} 