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
    <div className={`w-full border-t ${
      isDarkMode 
        ? 'bg-app-bg-dark border-gray-700 shadow-lg' 
        : 'bg-white border-gray-200 shadow-app'
    }`}>
      <div className={`py-3 px-4 sm:px-6 sm:py-4 w-full max-w-screen-2xl mx-auto`}>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto md:ml-[calc(16rem+1rem)] md:mr-auto">
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
            className={`p-3 rounded-xl ${
              isDarkMode 
                ? 'bg-app-card-dark text-gray-400 hover:text-app-purple' 
                : 'bg-white text-gray-500 hover:text-app-purple shadow-app'
            } transition-all duration-200`}
            disabled={disabled}
            aria-label="Upload image"
          >
            <Image className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            {imageFile && (
              <div className={`absolute -top-10 left-0 right-0 py-2 px-3 text-xs rounded-xl flex justify-between items-center ${
                isDarkMode ? 'bg-app-card-dark text-gray-300' : 'bg-white text-gray-700 shadow-app'
              }`}>
                <span className="truncate max-w-[90%]">📎 {imageFile.name}</span>
                <button 
                  type="button" 
                  onClick={clearImageFile}
                  className={`text-gray-500 hover:text-red-500 p-1 rounded-full ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
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
              className={`w-full px-4 py-3 sm:px-5 sm:py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-app-purple/50 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-app-card-dark text-white placeholder-gray-400' 
                  : 'bg-white text-gray-900 placeholder-gray-500 shadow-app'
              } transition-colors`}
              aria-label="Message input"
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || (!input.trim() && !imageFile)}
            className="p-3 sm:px-5 sm:py-3 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-app"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};