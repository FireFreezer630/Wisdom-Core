import React, { useState, useRef } from 'react';
import { Send, Image, X, Square } from 'lucide-react'; // Import Square
import { useTheme } from '../lib/ThemeProvider';

interface ChatInputProps {
  onSend: (message: string, imageFile?: File) => void;
  disabled: boolean;
  isLoading: boolean; // Add isLoading prop
  onStop: () => void; // Add onStop prop
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isLoading, onStop }) => { // Destructure isLoading and onStop
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // New state for image preview
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
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageFile = () => {
    setImageFile(null);
    setImagePreviewUrl(null); // Clear preview URL
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
            } transition-all duration-200 self-end flex-grow-0 flex-shrink-0`}
            disabled={disabled}
            aria-label="Upload image"
          >
            <Image className="h-5 w-5" />
          </button>
          
          {/* Container for image preview and input */}
          <div className="flex-1 flex flex-col min-w-0"> {/* Added flex and flex-col */}
            {/* Image Preview and File Name */}
            {imageFile && (
              <div className={`mb-2 w-full py-2 px-3 text-xs rounded-xl flex flex-col gap-2 ${
                isDarkMode ? 'bg-app-card-dark text-gray-300' : 'bg-white text-gray-700 shadow-app'
              }`}>
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Image preview"
                    className="max-h-16 w-auto rounded-md object-contain self-start max-w-full"
                  />
                )}
                <div className="flex justify-between items-center">
                  <span className="truncate max-w-[90%] flex-grow-0 flex-shrink">📎 {imageFile.name}</span>
                  <button
                    type="button"
                    onClick={clearImageFile}
                    className={`flex-shrink-0 text-gray-500 hover:text-red-500 p-1 rounded-full ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
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
          
          {isLoading ? (
            <button
              type="button" // Use type="button" to prevent form submission
              onClick={onStop}
              className="p-3 sm:px-5 sm:py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 shadow-app self-end flex-grow-0 flex-shrink-0"
              aria-label="Stop generating"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || (!input.trim() && !imageFile)}
              className="p-3 sm:px-5 sm:py-3 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-app self-end flex-grow-0 flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};