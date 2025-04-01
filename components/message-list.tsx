import { InstaQLEntity } from "@instantdb/react";
import { inspect } from "util";
import { AppSchema } from "@/instant.schema";
import { UIMessage } from "ai";
import Message from "./message";
type Message = InstaQLEntity<AppSchema, "messages">;

export default function MessageList({ messages, messagesOnDB }: { messages: UIMessage[], messagesOnDB: Message[] }) {
  
  console.log("messagesOnDB", messagesOnDB);
  console.log("messages", messages);
  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}