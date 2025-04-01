import { PaperPlaneTilt } from "@phosphor-icons/react";
import { motion } from "motion/react";

export default function NewMessageInput({ 
  input, 
  handleInputChange, 
  createMessage
}: { 
  input: string, 
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  createMessage: (input: string) => void 
}) {
  return (
    <motion.div
     className="px-4 bg-gradient-to-t from-white to-transparent via-50% via-white/80 absolute bottom-0 w-full py-8"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
     >
      <div className="mx-auto max-w-xl bg-white shadow-xl border border-sage-3 rounded-xl">
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          createMessage(input);
        }} className="w-full">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createMessage(input);
            }}
          >
            <PaperPlaneTilt size={16} weight="fill" />
            <p className="text-sm">Send Message</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}