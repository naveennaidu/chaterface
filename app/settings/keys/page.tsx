'use client'

import { useState, useEffect } from "react";
import Image from 'next/image';
import Button from "@/components/button";
import { CheckCircle, XCircle, FloppyDisk, Trash } from "@phosphor-icons/react";
import { useKey } from "@/providers/key-provider"; // Import useKey

export default function Keys() {
  const { providerKeys, setProviderKey, clearProviderKey } = useKey();

  // State for current input values, initialized from context
  const [inputOpenai, setInputOpenai] = useState('');
  const [inputAnthropic, setInputAnthropic] = useState('');
  const [inputGoogle, setInputGoogle] = useState('');

  // Sync input state with context state on mount and when context changes
  useEffect(() => {
    setInputOpenai(providerKeys.openai || '');
    setInputAnthropic(providerKeys.anthropic || '');
    setInputGoogle(providerKeys.google || '');
  }, [providerKeys]);

  // No need for separate initial* and *Saved states

  // Updated ProviderCard Component props definition
  interface ProviderCardProps {
    provider: 'openai' | 'anthropic' | 'google';
    logoSrc: string;
    inputKeyVal: string;
    setInputKeyVal: (value: string) => void;
    savedKeyVal: string | null; // Key from context
  }

  // Updated ProviderCard Component
  const ProviderCard = ({ provider, logoSrc, inputKeyVal, setInputKeyVal, savedKeyVal }: ProviderCardProps) => {
    const isSaved = !!savedKeyVal;
    const hasChanged = inputKeyVal !== (savedKeyVal || '');
    const trimmedInput = inputKeyVal.trim();
    // Disable Save if: input is empty OR (it is saved AND hasn't changed)
    const isDisabled = !trimmedInput || (isSaved && !hasChanged);
    const buttonText = isSaved && !hasChanged ? 'Saved' : 'Save Key';

    const handleSave = () => {
        if (trimmedInput) {
            setProviderKey(provider, trimmedInput);
        } else {
            // If input is empty/whitespace, treat as delete
            handleDelete();
        }
    };

    const handleDelete = () => {
        clearProviderKey(provider);
        // Input state will be cleared by the useEffect hook reacting to providerKeys change
    };

    return (
      <div className="bg-sage-2 border border-sage-4 rounded-lg p-4 flex flex-col gap-3">
        {/* Header with Logo, Name, Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt={`${provider} Logo`} width={24} height={24} className="opacity-90 flex-shrink-0" />
            <h2 className="text-lg font-medium text-sage-12 truncate capitalize">{provider}</h2>
          </div>
          {isSaved ? (
            <span className="flex items-center flex-shrink-0 gap-1 text-xs text-green-600 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
              <CheckCircle size={14} weight="bold" /> Saved
            </span>
          ) : (
            <span className="flex items-center flex-shrink-0 gap-1 text-xs text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
               <XCircle size={14} weight="bold"/> Not Set
            </span>
          )}
        </div>
        {/* Input Field */}
        <input
          type="password"
          placeholder={`Enter your ${provider} API Key...`}
          value={inputKeyVal}
          onChange={(e) => setInputKeyVal(e.target.value)}
          className="w-full bg-sage-1 border border-sage-5 rounded-md px-3 py-2 text-sm text-sage-12 placeholder:text-sage-10 focus:outline-none focus:ring-1 focus:ring-sage-7 focus:border-sage-7"
        />
        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-1">
          <Button
            onClick={handleSave}
            size="small"
            className="flex-1 bg-sage-3 hover:bg-sage-4 text-sage-12 border border-sage-5 disabled:opacity-50 flex items-center justify-center gap-1.5"
            disabled={isDisabled}
          >
            <FloppyDisk size={14} weight={buttonText === 'Saved' ? 'regular' : 'bold'} />
            {buttonText}
          </Button>
          {isSaved && (
             <Button
               onClick={handleDelete}
               size="small"
               className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center justify-center gap-1.5"
             >
              <Trash size={14} weight="bold" />
              Delete
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-sage-12 mb-2">API Keys</h1>
      <p className="text-sm text-sage-11 mb-6">Manage your API keys for different providers. Keys are stored securely in your browser&apos;s local storage and never leave your device.</p>

      <div className="flex flex-col gap-4">
        <ProviderCard
          provider="openai"
          logoSrc="/OpenAI_Logo.svg.png"
          inputKeyVal={inputOpenai}
          setInputKeyVal={setInputOpenai}
          savedKeyVal={providerKeys.openai}
        />

        <ProviderCard
          provider="anthropic"
          logoSrc="/Anthropic_logo.svg.png"
          inputKeyVal={inputAnthropic}
          setInputKeyVal={setInputAnthropic}
          savedKeyVal={providerKeys.anthropic}
        />

        <ProviderCard
          provider="google"
          logoSrc="/Google_Gemini_logo.svg.png" // Make sure filename matches
          inputKeyVal={inputGoogle}
          setInputKeyVal={setInputGoogle}
          savedKeyVal={providerKeys.google}
        />
      </div>
    </div>
  );
}
