import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/button';
import Logo from '@/components/logo';
import { Lora } from "next/font/google";
import { GithubLogo, ChatTeardropDots, Gear } from "@phosphor-icons/react/dist/ssr";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface IntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IntroductionModal: React.FC<IntroductionModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-sage-2 p-2 rounded-xl better-shadow max-w-xl w-full border border-sage-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="flex flex-col w-full relative overflow-hidden rounded-lg"
          style={{
            backgroundImage: "url('/hero-noise.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full">
            <div className="flex flex-row items-center w-full max-w-7xl mx-auto pt-8 pb-4 justify-between">
              <div className="flex flex-row items-center w-max mx-auto gap-4 dark">
                <Logo color="white"/>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-4 pb-40 px-4">
            <h1 className={`${lora.className} text-2xl font-semibold text-sage-1 relative z-10`}>Your Interface to Intelligence</h1>
            <p className={`text-sm text-sage-5 relative z-10`}>Chaterface is an open source chat interface for large language models.</p>

            {/* Uncomment and adjust links if needed */}
            {/* <div className="flex flex-row items-center gap-2 mx-auto w-max mt-4">
              <Button href="https://github.com/hyperaide/chaterface" target="_blank" className="bg-sage-12/50 text-sage-2 hover:shadow-none hover:bg-sage-12 duration-300" icon={<GithubLogo size={16} weight="bold" />}>View on GitHub</Button>
              <Button onClick={onClose} className="bg-sage-12 text-sage-2 hover:shadow-none hover:bg-sage-12/85 duration-300" icon={<ChatTeardropDots size={16} weight="bold" />}>Try it out</Button>
            </div> */}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 px-2 pb-2">
          {/* Open Source Card */}
          <div className="flex flex-col gap-1 bg-sage-3 border border-sage-4 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
               <GithubLogo size={18} weight="bold" className="text-green-500"/>
              <h3 className="text-base font-semibold text-sage-12">Open Source</h3>
            </div>
            <p className="text-sm text-sage-11">
              Chaterface is fully open-source on GitHub. Feel free to inspect, modify, and contribute.
            </p>
             <Button size="small" href="https://github.com/hyperaide/chaterface" target="_blank" className="mt-2 bg-sage-4 hover:bg-sage-5 text-sage-12 border border-sage-6" icon={<GithubLogo size={14} weight="bold" />}>View on GitHub</Button>
          </div>

          {/* Multi-Model Card */}
          <div className="flex flex-col gap-1 bg-sage-3 border border-sage-4 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
               <ChatTeardropDots size={18} weight="bold" className="text-orange-500"/>
               <h3 className="text-base font-semibold text-sage-12">Unified Interface</h3>
            </div>
            <p className="text-sm text-sage-11">
              Access leading models from OpenAI, Anthropic, and Google all in one consistent chat interface.
            </p>
          </div>

          {/* Local Keys Card */}
          <div className="flex flex-col gap-1 bg-sage-3 md:col-span-2 border border-sage-4 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
               <Gear size={18} weight="bold" className="text-sky-500"/>
               <h3 className="text-base font-semibold text-sage-12">Secure & Private</h3>
            </div>
            <p className="text-sm text-sage-11 mb-2">
              Your API keys are stored securely only in your browser's local storage. No sign-up needed, no data leaves your machine.
            </p>
            <Button size="small" href="/settings/keys" className="mt-auto bg-sage-4 hover:bg-sage-5 text-sage-12 border border-sage-6 duration-100" icon={<Gear size={14} weight="bold" />}>Manage API Keys</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IntroductionModal; 