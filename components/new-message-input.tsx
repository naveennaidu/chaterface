import { ArrowRight, Gear, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { models } from "@/constants/models";
import { useKey } from "@/providers/key-provider";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewMessageInput({ 
  input, 
  handleInputChange, 
  createMessage,
  selectedModel,
  setSelectedModel,
  onHomepage,
}: { 
  input: string, 
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  createMessage: (input: string) => void,
  selectedModel: string,
  setSelectedModel: (model: string) => void,
  onHomepage?: boolean
}) {

  const { getProviderKey } = useKey();
  const [selectedModelHasNoKey, setSelectedModelHasNoKey] = useState(false);

  useEffect(() => {
    if(getProviderKey(selectedModel) === null){
      setSelectedModelHasNoKey(true);
    }else{
      setSelectedModelHasNoKey(false);
    }
  }, [getProviderKey, selectedModel]);

  return (
    <div
     className={`px-4 w-full py-8 ${onHomepage ? "" : "absolute bottom-0 bg-gradient-to-t from-white to-transparent via-50% via-white/80"}`}
     >
      <AnimatePresence>
        {selectedModelHasNoKey && (
          <motion.div
            className="mx-auto max-w-xl bg-amber-2 p-2 border border-amber-4 rounded-xl z-40 mb-2 flex-col flex gap-2"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1 }}
          exit={{ opacity: 0, y: 50 }}
        >
          {/* <Warning size={18} weight="bold" className="text-amber-10 mt-1" /> */}
            <div className="flex flex-col gap-2">
            <p className="text-amber-11 text-sm">Looks like you dont have an API key set for this provider. Please set an API key in the settings page.</p>
            <Link href="/settings/keys" className="text-amber-12 text-sm w-max flex items-center gap-2 font-medium">
              Set Provider Keys
              <ArrowRight size={12} weight="bold" />
            </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="mx-auto max-w-xl bg-white shadow-xl border border-sage-3 rounded-xl 2-50"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          createMessage(input);
        }} className="w-full">
          <input
            className="w-full p-4 border-b border-sage-3 focus:outline-none focus:ring-0 resize-none text-sm"
            value={input}
            placeholder={selectedModelHasNoKey ? "Please set an API key in the settings page" : "Say something..."}
            onChange={handleInputChange}
            disabled={selectedModelHasNoKey}
          />
        </form>
        <div className="flex justify-between items-center p-2">
          <select
            className="text-sage-600 bg-sage-1 px-2 py-1 text-sm flex items-center gap-2 rounded-md border border-sage-3 hover:bg-sage-2 transition-colors cursor-pointer" 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
          <button 
            className="text-sage-600 ml-auto bg-sage-1 px-2 py-1 text-sm flex items-center gap-2 rounded-md border border-sage-3 hover:bg-sage-2 transition-colors cursor-pointer" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createMessage(input);
            }}
            disabled={selectedModelHasNoKey}
          >
            <PaperPlaneTilt size={16} weight="fill" />
            <p className="text-sm">Send Message</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}