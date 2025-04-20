import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Volume2 } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useTheme } from '../lib/ThemeProvider';
import type { Message, MessageContent } from '../types';

interface ChatMessageProps {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = role === 'user';
  const { isDarkMode } = useTheme();
  
  const getMessageContent = (content: string | MessageContent[]): string => {
    if (typeof content === 'string') {
      return content;
    }
    return content
      .filter(item => item.type === 'text' && item.text)
      .map(item => item.text)
      .join('');
  };

  const messageContent = getMessageContent(content);

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
    const utterance = new SpeechSynthesisUtterance(messageContent);
    window.speechSynthesis.speak(utterance);
  };

  // Dynamic styling based on dark mode
  const userBubbleStyles = isUser 
    ? 'bg-purple-600 text-white' 
    : isDarkMode 
      ? 'bg-gray-800 text-gray-100 border border-gray-700' 
      : 'bg-white text-gray-800 border border-gray-100 shadow-sm';

  const userIconStyles = isUser 
    ? 'bg-purple-600' 
    : isDarkMode 
      ? 'bg-gray-700' 
      : 'bg-gray-200';

  const textIconColor = isUser 
    ? 'text-white' 
    : isDarkMode 
      ? 'text-gray-300' 
      : 'text-gray-600';

  const actionButtonStyle = isDarkMode 
    ? 'text-gray-400 hover:text-purple-400' 
    : 'text-gray-500 hover:text-purple-600';

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
      <div className={`flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center ${userIconStyles}`}>
        {isUser ? (
          <User className={`h-4 w-4 sm:h-5 sm:w-5 ${textIconColor}`} />
        ) : (
          <Bot className={`h-4 w-4 sm:h-5 sm:w-5 ${textIconColor}`} />
        )}
      </div>
      <div className={`flex-1 ${isUser ? 'mr-1 sm:mr-2' : 'ml-1 sm:ml-2'} max-w-[85%] sm:max-w-[90%]`}>
        <div className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg ${userBubbleStyles}`}>
          <ReactMarkdown 
            className={`prose max-w-none text-sm sm:text-base ${isDarkMode ? 'prose-invert' : ''}`}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {messageContent}
          </ReactMarkdown>
        </div>
        {!isUser && (
          <div className="flex gap-2 mt-1 sm:mt-2">
            <button
              onClick={copyToClipboard}
              className={`p-1 rounded ${actionButtonStyle}`}
              title={isCopied ? 'Copied!' : 'Copy to clipboard'}
              aria-label={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={speakText}
              className={`p-1 rounded ${actionButtonStyle}`}
              title="Text to speech"
              aria-label="Read message aloud"
            >
              <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            {isCopied && (
              <span className="text-xs text-gray-500 dark:text-gray-400 self-center">Copied!</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};