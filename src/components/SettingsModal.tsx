import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        className={`relative ${
          isDarkMode ? 'bg-app-card-dark text-white' : 'bg-white text-gray-800'
        } rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-app`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 z-10">
          <h2 id="settings-title" className="text-xl font-bold bg-gradient-to-r from-app-purple to-purple-400 bg-clip-text text-transparent">Settings</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-500 hover:bg-gray-100'
            } transition-colors`}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-7">
          <label htmlFor="system-prompt" className={`block text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Default System Prompt
          </label>
          <textarea
            id="system-prompt"
            value={tempPrompt}
            onChange={(e) => setTempPrompt(e.target.value)}
            className={`w-full h-36 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-purple/50 ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            } transition-colors`}
            placeholder="Enter the default system prompt..."
          />
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToCurrentChat}
                onChange={(e) => setApplyToCurrentChat(e.target.checked)}
                className={`rounded focus:ring-app-purple h-4 w-4 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-app-purple'
                    : 'border-gray-300 text-app-purple'
                }`}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Also apply to current conversation
              </span>
            </label>
          </div>
        </div>

        <div className="mb-7">
          <label className="flex items-center justify-between cursor-pointer">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Dark Mode
            </span>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-app-purple/50 focus:ring-offset-2 ${
                isDarkMode ? 'bg-app-purple' : 'bg-gray-200'
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

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-800/70' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-app-purple text-white rounded-xl hover:bg-app-purple-dark transition-all duration-200 font-medium flex items-center gap-2 shadow-app"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};