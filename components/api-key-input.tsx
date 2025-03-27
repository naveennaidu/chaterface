'use client';

import { useState } from 'react';
import { useKey } from '@/app/providers/key-provider';
import Button from './button';

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
      <div className="flex items-center gap-2 text-sm text-sage-11">
        <span>{label}: {providerKeys[provider]?.slice(0, 4)}...{providerKeys[provider]?.slice(-4)}</span>
        <Button
          size="small"
          onClick={handleChange}
          className="text-xs"
        >
          Change
        </Button>
        <Button
          size="small"
          onClick={handleClear}
          className="text-xs text-red-500"
        >
          Clear
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="password"
        value={inputKey}
        onChange={(e) => setInputKey(e.target.value)}
        placeholder={`Enter ${label}...`}
        className="text-sm bg-sage-3 text-sage-12 border border-sage-4 rounded-md px-2 py-1 outline-none hover:bg-sage-4 transition-colors min-w-[200px]"
        autoFocus
      />
      <Button
        size="small"
        onClick={handleSubmit}
        className="text-xs"
      >
        Save
      </Button>
      {isEditing && providerKeys[provider] && (
        <Button
          size="small"
          onClick={() => setIsEditing(false)}
          className="text-xs"
        >
          Cancel
        </Button>
      )}
    </form>
  );
} 