import React, { useState, useRef } from 'react';
import { Send, Image, X } from 'lucide-react';
import { useTheme } from '../lib/ThemeProvider';

interface ChatInputProps {
  onSend: (message: string, imageFile?: File) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || imageFile) {
      onSend(input, imageFile || undefined);
      setInput('');
      setImageFile(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const clearImageFile = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gradient-to-t from-gray-900' : 'bg-gradient-to-t from-white'} to-transparent py-2 px-2 sm:px-4 sm:py-4`}>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
          aria-label="Upload image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-lg ${
            isDarkMode 
              ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-800' 
              : 'text-gray-500 hover:text-purple-600 hover:bg-gray-100'
          }`}
          disabled={disabled}
          aria-label="Upload image"
        >
          <Image className="h-5 w-5" />
        </button>
        
        <div className="flex-1 relative">
          {imageFile && (
            <div className={`absolute -top-8 left-0 right-0 py-1 px-2 text-xs rounded-t-lg flex justify-between items-center ${
              isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              <span className="truncate max-w-[90%]">📎 {imageFile.name}</span>
              <button 
                type="button" 
                onClick={clearImageFile}
                className="text-gray-500 hover:text-red-500"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={disabled}
            className={`w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            aria-label="Message input"
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || (!input.trim() && !imageFile)}
          className="p-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};