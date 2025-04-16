import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Volume2 } from 'lucide-react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Message, MessageContent } from '../types';

interface ChatMessageProps {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = role === 'user';
  
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

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-purple-600' : 'bg-gray-200'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-gray-600" />
        )}
      </div>
      <div className="flex-1">
        <div className={`px-4 py-2 rounded-lg ${
          isUser ? 'bg-purple-600 text-white' : 'bg-white'
        }`}>
          <ReactMarkdown 
            className="prose max-w-none dark:prose-invert"
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {messageContent}
          </ReactMarkdown>
        </div>
        {!isUser && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={copyToClipboard}
              className="p-1 text-gray-500 hover:text-purple-600 rounded"
              title={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={speakText}
              className="p-1 text-gray-500 hover:text-purple-600 rounded"
              title="Text to speech"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};