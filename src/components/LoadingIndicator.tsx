import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../lib/ThemeProvider';

interface LoadingIndicatorProps {
  type: 'isSyllabusLoading' | 'isWebSearchLoading' | 'isGeneratingResponse';
  className?: string;
}

const loadingMessages = {
  isSyllabusLoading: 'Searching syllabus...',
  isWebSearchLoading: 'Searching the web...',
  isGeneratingResponse: 'Generating response...',
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ type, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`h-4 w-4 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {loadingMessages[type]}
      </span>
    </div>
  );
}; 