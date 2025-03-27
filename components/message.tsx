import { DateTime } from "luxon";
import { InstaQLEntity } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MessageProps {
  message: InstaQLEntity<AppSchema, "messages">;
  isStreaming?: boolean;
}

export default function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-row ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "text-end" : "text-start"} rounded-xl px-4 py-2 max-w-[80%]`}>
        <ModelName model={message.model} />
        <div className="text-sm">
          <Markdown
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="text-xs !font-mono"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </Markdown>
        </div>
        <p className="text-xs text-sage-10 mt-1 font-mono">
          {isStreaming ? 'Streaming...' : DateTime.fromISO(message.createdAt as string).toFormat('h:mm a')}
        </p>
      </div>
    </div>
  );
} 


function ModelName({ model }: { model: string | null }) {

  if (!model) return null;

  return (
    <p className="text-sm text-sage-10 mt-1 font-mono">
      {model.split('/')[1]}
    </p>
  );
}