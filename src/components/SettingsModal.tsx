import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useTheme } from '../lib/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, activeConversationId, updateConversation, conversations } = useChatStore();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [tempPrompt, setTempPrompt] = useState(settings.defaultSystemPrompt);
  const [applyToCurrentChat, setApplyToCurrentChat] = useState(false);

  // Update the tempPrompt when settings change
  useEffect(() => {
    if (isOpen) {
      setTempPrompt(settings.defaultSystemPrompt);
    }
  }, [isOpen, settings.defaultSystemPrompt]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({ 
      defaultSystemPrompt: tempPrompt,
    });

    if (applyToCurrentChat && activeConversationId) {
      const conversation = conversations.find(conv => conv.id === activeConversationId);
      if (conversation) {
        updateConversation(activeConversationId, { systemPrompt: tempPrompt });
      }
    }

    onClose();
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className={`relative ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 z-10">
          <h2 id="settings-title" className="text-xl font-bold">Settings</h2>
          <button 
            onClick={onClose} 
            className={`p-1 rounded-full ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
            aria-label="Close settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label htmlFor="system-prompt" className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Default System Prompt
          </label>
          <textarea
            id="system-prompt"
            value={tempPrompt}
            onChange={(e) => setTempPrompt(e.target.value)}
            className={`w-full h-36 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="Enter the default system prompt..."
          />
          <div className="mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={applyToCurrentChat}
                onChange={(e) => setApplyToCurrentChat(e.target.checked)}
                className={`rounded focus:ring-purple-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-purple-500'
                    : 'border-gray-300 text-purple-600'
                }`}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Also apply to current conversation
              </span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dark Mode
            </span>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isDarkMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
              aria-pressed={isDarkMode}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};