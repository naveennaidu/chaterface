'use client'

import { useState, useEffect } from "react";
import Image from 'next/image';
import Button from "@/components/button";
import { CheckCircle, XCircle, FloppyDisk, Trash } from "@phosphor-icons/react";
import { useKey } from "@/providers/key-provider"; // Import useKey

// Updated ProviderCard Component props definition
interface ProviderCardProps {
  provider: 'openai' | 'anthropic' | 'google';
  logoSrc: string;
  inputKeyVal: string;
  setInputKeyVal: (value: string) => void;
  savedKeyVal: string | null; // Key from context
  setProviderKey: (provider: 'openai' | 'anthropic' | 'google', key: string) => void;
  clearProviderKey: (provider: 'openai' | 'anthropic' | 'google') => void;
}

// Updated ProviderCard Component (moved outside Keys)
const ProviderCard = ({ provider, logoSrc, inputKeyVal, setInputKeyVal, savedKeyVal, setProviderKey, clearProviderKey }: ProviderCardProps) => {
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
      setInputKeyVal('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Logo, Name, Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-mono uppercase font-medium text-sage-12 truncate capitalize">{provider}</h2>
        </div>
        {isSaved ? (
          <span className="flex items-center flex-shrink-0 gap-1 text-xs text-green-600  bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-md">
            <CheckCircle size={14} weight="bold" /> Saved
          </span>
        ) : (
          <span className="flex items-center flex-shrink-0 gap-1 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
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
             className="flex-shrink-0 bg-red-50 hover:bg-red-100 dark:bg-red-900 hover:dark:bg-red-800 text-red-700 dark:text-red-100 border border-red-200 dark:border-red-800 flex items-center justify-center gap-1.5"
           >
            <Trash size={14} weight="bold" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Keys() {
  const { providerKeys, setProviderKey, clearProviderKey } = useKey();

  // State for current input values, initialized from context
  const [inputOpenai, setInputOpenai] = useState(providerKeys.openai || '');
  const [inputAnthropic, setInputAnthropic] = useState(providerKeys.anthropic || '');
  const [inputGoogle, setInputGoogle] = useState(providerKeys.google || '');

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-lg font-semibold text-sage-12 mb-1">API Keys</h1>
      <p className="text-xs text-sage-11 mb-6 font-mono">Manage your API keys for different providers. Keys are stored securely in your browser&apos;s local storage and never leave your device.</p>

      <div className="flex flex-col gap-4">
        <ProviderCard
          provider="openai"
          logoSrc="/OpenAI_Logo.svg.png"
          inputKeyVal={inputOpenai}
          setInputKeyVal={setInputOpenai}
          savedKeyVal={providerKeys.openai}
          setProviderKey={setProviderKey}
          clearProviderKey={clearProviderKey}
        />

        <ProviderCard
          provider="anthropic"
          logoSrc="/Anthropic_logo.svg.png"
          inputKeyVal={inputAnthropic}
          setInputKeyVal={setInputAnthropic}
          savedKeyVal={providerKeys.anthropic}
          setProviderKey={setProviderKey}
          clearProviderKey={clearProviderKey}
        />

        <ProviderCard
          provider="google"
          logoSrc="/Google_Gemini_logo.svg.png" // Make sure filename matches
          inputKeyVal={inputGoogle}
          setInputKeyVal={setInputGoogle}
          savedKeyVal={providerKeys.google}
          setProviderKey={setProviderKey}
          clearProviderKey={clearProviderKey}
        />
      </div>
    </div>
  );
}
