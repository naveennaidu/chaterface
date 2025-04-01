'use client';

import { useState } from 'react';
import { useKey } from '@/providers/key-provider';
import { PencilSimple, X } from '@phosphor-icons/react';

interface ApiKeyInputProps {
  provider: 'openai' | 'anthropic' | 'google';
  label: string;
}

export default function ApiKeyInput({ provider, label }: ApiKeyInputProps) {
  const { providerKeys, setProviderKey, clearProviderKey } = useKey();
  const [inputKey, setInputKey] = useState('');
  const [isEditing, setIsEditing] = useState(!providerKeys[provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setProviderKey(provider, inputKey.trim());
      setInputKey('');
      setIsEditing(false);
    }
  };

  const handleChange = () => {
    setIsEditing(true);
    setInputKey('');
  };

  const handleClear = () => {
    clearProviderKey(provider);
    setIsEditing(true);
  };

  if (providerKeys[provider] && !isEditing) {
    return (
      <div className="flex items-center gap-1 text-xs font-mono text-sage-11">
        <span className="w-full p-2">{label}: {providerKeys[provider]?.slice(0, 4)}...{providerKeys[provider]?.slice(-4)}</span>
        <PencilSimple
          size={16}
          weight="bold"
          onClick={handleChange}
          className="cursor-pointer text-sage-11 hover:text-sage-12 transition-colors"
        />
        <X
          size={16}
          weight="bold"
          onClick={handleClear}
          className="cursor-pointer text-sage-11 hover:text-sage-12 transition-colors mr-2"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 bg-red-2 p-2 rounded">
      <input
        type="text"
        value={inputKey}
        onChange={(e) => setInputKey(e.target.value)}
        placeholder={`Enter ${label}...`}
        className="text-sm text-sage-12 w-full border-sage-4 p-2 outline-none hover:bg-sage-4 transition-colors min-w-[200px]"
        autoFocus
      />
      <button
        type="submit"
        className="text-xs border-0 bg-sage-3 h-full text-sage-12 hover:bg-sage-4 transition-colors px-2 py-1 rounded"
      >
        Save
      </button>
      {isEditing && providerKeys[provider] && (
        <X
          size={16}
          weight="bold"
          onClick={() => setIsEditing(false)}
          className="cursor-pointer text-sage-11 hover:text-sage-12 transition-colors mr-2"
        />
      )}
    </form>
  );
} 