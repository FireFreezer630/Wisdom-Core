import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Copy, Volume2, Square } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTheme } from '../lib/ThemeProvider';
import { FlashcardRenderer } from './flashcards/FlashcardRenderer';
import type { Message, MessageContent } from '../types';
import { motion } from 'framer-motion'; // Import motion

interface ChatMessageProps {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | MessageContent[] | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = role === 'user';
  const isFunction = role === 'function';
  const { isDarkMode } = useTheme();

  const getMessageContent = (content: string | MessageContent[] | null): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (!content) {
      return '';
    }
    return content
      .filter(item => item.type === 'text' && item.text)
      .map(item => item.text)
      .join('');
  };

  const messageContent = getMessageContent(content);

  // Determine if the message contains flashcards
  const hasFlashcards = typeof content !== 'string' && content && content.some(
    item => item.type === 'flashcard' || item.type === 'flashcard_set'
  );

  // If this is a function message, handle it differently
  if (isFunction) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center my-1">
        {messageContent || 'Function executed'}
      </div>
    );
  }

  // Clean up TTS on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const speakText = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(messageContent);

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  // Dynamic styling based on dark mode
  const userBubbleStyles = isUser
    ? 'bg-app-purple text-white'
    : isDarkMode
      ? 'bg-app-card-dark text-gray-100 border border-gray-700'
      : 'bg-app-card-light text-gray-800 border-0 shadow-app';

  const userIconStyles = 'bg-app-purple';
  const textIconColor = 'text-white';

  const actionButtonStyle = isDarkMode
    ? 'text-gray-400 hover:text-app-purple'
    : 'text-gray-500 hover:text-app-purple';

  // Adjust bubble border radius based on sender
  const bubbleRadius = isUser
    ? 'rounded-2xl rounded-tr-md'
    : 'rounded-2xl rounded-tl-md';

  return (
    <motion.div // Use motion.div for animation
      className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''} mb-6 items-end`}
      initial={{ opacity: 0, y: 20 }} // Initial state: hidden and slightly below
      animate={{ opacity: 1, y: 0 }} // Animate to visible and original position
      transition={{ duration: 0.3, ease: "easeOut" }} // Animation duration and easing
    >
      {isUser && (
        <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center ${userIconStyles}`}>
          <User className={`h-4 w-4 sm:h-5 sm:w-5 ${textIconColor}`} />
        </div>
      )}

      <div className={`flex-1 ${isUser ? 'mr-1 sm:mr-2' : 'ml-0'} max-w-[90%] sm:max-w-[92%]`}>
        <div className={`px-4 py-3 sm:px-5 sm:py-4 ${bubbleRadius} ${userBubbleStyles} transition-all ${hasFlashcards ? '' : 'overflow-x-auto'}`}>
          {/* Render content based on type */}
          {typeof content === 'string' ? (
            // Render simple string content (for older messages or system prompts)
            <ReactMarkdown
              className={`prose max-w-none text-sm sm:text-base ${isDarkMode ? 'prose-invert' : ''} math-renderer`}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, output: 'html' }]]}
            >
              {content}
            </ReactMarkdown>
          ) : (
            // Render array content (for multimodal messages)
            content && content.map((item, index) => {
              if (item.type === 'text' && item.text) {
                return (
                  <ReactMarkdown
                    key={index} // Use index as key for items in array
                    className={`prose max-w-none text-sm sm:text-base ${isDarkMode ? 'prose-invert' : ''} math-renderer`}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, output: 'html' }]]}
                  >
                    {item.text}
                  </ReactMarkdown>
                );
              } else if (item.type === 'image_url' && item.image_url?.url) {
                return (
                  <div key={index} className="my-2"> {/* Add some spacing around images */}
                    <img
                      src={item.image_url.url}
                      alt="Uploaded image" // Add alt text for accessibility
                      className="max-w-full h-auto rounded-lg shadow-md" // Basic styling
                      style={{ maxHeight: '300px' }} // Limit image height
                    />
                  </div>
                );
              } else if (item.type === 'flashcard' || item.type === 'flashcard_set') {
                 return <FlashcardRenderer key={index} content={item} />;
              }
              // Handle other potential content types or null items if necessary
              return null;
            })
          )}
        </div>
        {!isUser && (
          <div className="flex gap-2 mt-2 sm:mt-3 pl-1">
            <button
              onClick={copyToClipboard}
              className={`p-1.5 rounded-lg ${actionButtonStyle} transition-colors ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}
              title={isCopied ? 'Copied!' : 'Copy to clipboard'}
              aria-label={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={speakText}
              className={`p-1.5 rounded-lg ${
                isPlaying
                  ? 'text-red-500 hover:text-red-600'
                  : actionButtonStyle
              } transition-colors ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}
              title={isPlaying ? 'Stop speech' : 'Text to speech'}
              aria-label={isPlaying ? 'Stop speech' : 'Read message aloud'}
            >
              {isPlaying ? (
                <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
            {isCopied && (
              <span className="text-xs text-gray-500 dark:text-gray-400 self-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                Copied!
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div> // Close motion.div
  );
};