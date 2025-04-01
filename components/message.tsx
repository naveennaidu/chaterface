import { UIMessage } from "ai";

export default function Message({ message }: { message: UIMessage }) {

  const baseClass = "w-max max-w-2xl";
  const userClass = "ml-auto";
  const aiClass = "mr-auto";

  return(
    <div className={`${baseClass} ${message.role === "user" ? userClass : aiClass}`}>
      <p>{message.content}</p>
    </div>
    );
}