import { DateTime } from "luxon";
import { InstaQLEntity } from "@instantdb/react";
import { AppSchema } from "@/instant.schema";
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from 'next/link';
import { WarningCircle } from "@phosphor-icons/react";

interface MessageProps {
  message: InstaQLEntity<AppSchema, "messages">;
  isStreaming?: boolean;
}

export default function Message({ message, isStreaming = false }: MessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const containerClasses = "flex flex-row";
  const messageBoxBaseClasses = "py-2 max-w-[80%]";
  
  let alignmentClass = "justify-start";
  let messageBoxSpecificClasses = "text-sage-12";

  if (isUser) {
    alignmentClass = "justify-end";
    messageBoxSpecificClasses = "text-sage-12";
  } else if (isSystem) {
    messageBoxSpecificClasses = "text-amber-900";
  }

  return (
    <div className={`${containerClasses} ${alignmentClass}`}>
      <div className={`${messageBoxBaseClasses} ${messageBoxSpecificClasses}`}>
        {!isUser && !isSystem && <ModelName model={message.model} />}
        <div className={`text-sm ${isSystem ? 'flex items-start gap-1.5' : ''}`}>
          {isSystem && <WarningCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />} 
          <Markdown
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    className="text-xs !font-mono rounded-md my-2 !bg-sage-1 overflow-x-auto"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={`${className} bg-sage-4 text-sage-12 px-1 py-0.5 rounded-sm text-xs font-mono`} {...props}>
                    {children}
                  </code>
                );
              },
              a({ node, href, children, ...props }: any) {
                if (href && href.startsWith('/')) {
                  return (
                    <Link href={href} className="font-medium text-blue-600 hover:text-blue-700 underline" {...props}>
                      {children}
                    </Link>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 underline" {...props}>
                    {children}
                  </a>
                );
              }
            }}
          >
            {message.content}
          </Markdown>
        </div>
        {!isSystem && (
           <p className={`text-xs mt-1 font-mono text-sage-10`}>
            {isStreaming ? 'Streaming...' : DateTime.fromISO(message.createdAt as string).toFormat('h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
} 

function ModelName({ model }: { model: string | null }) {

  if (!model) return null;

  const modelName = model.split('/')[1] || model; 

  return (
    <p className="text-xs font-mono text-sage-10 mb-0.5">
      {modelName}
    </p>
  );
}