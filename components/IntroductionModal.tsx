import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/button';
import Logo from '@/components/logo';
import { Lora } from "next/font/google";
import { GithubLogo, ChatTeardropDots, Gear, EnvelopeSimple, Key, ArrowClockwise, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useAuth } from '@/providers/auth-provider';

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface IntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'email' | 'code' | 'success';

const IntroductionModal: React.FC<IntroductionModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, isLoading, sendMagicCode, signInWithMagicCode } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setCode('');
      setAuthStep('email');
      setError(null);
    }
  }, [isOpen]);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

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
  
  const handleSendMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await sendMagicCode(email);
      setAuthStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await signInWithMagicCode(email, code);
      setAuthStep('success');
      // The modal will auto-close when isAuthenticated becomes true
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderAuthStep = () => {
    switch (authStep) {
      case 'email':
        return (
          <form onSubmit={handleSendMagicCode} className="w-full space-y-4 p-4 bg-sage-3 rounded-lg border border-sage-4">
            <h3 className={`${lora.className} text-xl font-semibold text-sage-12`}>Sign In</h3>
            <p className="text-sm text-sage-11">Enter your email to receive a sign-in code</p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sage-9">
                <EnvelopeSimple size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full py-2 pl-10 pr-4 bg-sage-4 text-sage-11 placeholder-sage-9 border border-sage-5 rounded-md focus:outline-none focus:ring-1 focus:ring-sage-8"
                disabled={isSubmitting}
                required
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center font-medium rounded-lg bg-sage-10 hover:bg-sage-11 text-sage-1 transition-colors px-4 py-2 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ArrowClockwise size={16} className="animate-spin mr-2" />
                  Sending Code...
                </>
              ) : (
                'Send Sign-in Code'
              )}
            </button>
          </form>
        );
        
      case 'code':
        return (
          <form onSubmit={handleVerifyCode} className="w-full space-y-4 p-4 bg-sage-3 rounded-lg border border-sage-4">
            <h3 className={`${lora.className} text-xl font-semibold text-sage-12`}>Enter Code</h3>
            <p className="text-sm text-sage-11">We sent a verification code to <strong>{email}</strong></p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sage-9">
                <Key size={18} />
              </div>
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full py-2 pl-10 pr-4 bg-sage-4 text-sage-11 placeholder-sage-9 border border-sage-5 rounded-md focus:outline-none focus:ring-1 focus:ring-sage-8"
                disabled={isSubmitting}
                required
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <div className="flex gap-2">
              <button 
                type="button"
                className="w-1/2 inline-flex items-center justify-center font-medium rounded-lg bg-sage-4 hover:bg-sage-5 text-sage-11 border border-sage-6 transition-colors px-4 py-2 text-sm"
                onClick={() => setAuthStep('email')}
                disabled={isSubmitting}
              >
                Back
              </button>
              
              <button 
                type="submit"
                className="w-1/2 inline-flex items-center justify-center font-medium rounded-lg bg-sage-10 hover:bg-sage-11 text-sage-1 transition-colors px-4 py-2 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ArrowClockwise size={16} className="animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>
          </form>
        );
        
      case 'success':
        return (
          <div className="w-full space-y-4 p-4 bg-sage-3 rounded-lg border border-sage-4 flex flex-col items-center justify-center">
            <CheckCircle size={48} className="text-green-500" />
            <h3 className={`${lora.className} text-xl font-semibold text-sage-12`}>Success!</h3>
            <p className="text-sm text-sage-11 text-center">You're now signed in. Welcome to IchiGPT!</p>
          </div>
        );
    }
  };

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

          <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto py-4 pb-24 px-4">
            <h1 className={`${lora.className} text-2xl font-semibold text-sage-1 relative z-10`}>Your Interface to Intelligence</h1>
            <p className={`text-sm text-sage-5 relative z-10`}>IchiGPT is a chat interface for large language models based on the open source chaterface project.</p>
          </div>
        </div>

        {/* Authentication UI */}
        <div className="mx-auto -mt-16 px-4 z-20 relative mb-6 max-w-md w-full">
          {renderAuthStep()}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 px-2 pb-2">
          {/* Open Source Card */}
          <div className="flex flex-col gap-1 bg-sage-3 border border-sage-4 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
               <GithubLogo size={18} weight="bold" className="text-green-500"/>
              <h3 className="text-base font-semibold text-sage-12">Open Source Based</h3>
            </div>
            <p className="text-sm text-sage-11">
              IchiGPT is built on the open-source chaterface project, providing a powerful and customizable chat experience.
            </p>
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