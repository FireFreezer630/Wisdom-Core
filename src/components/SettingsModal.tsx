import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useChatStore, DEFAULT_SYSTEM_PROMPT } from '../store/chatStore'; // Import DEFAULT_SYSTEM_PROMPT
import { useTheme } from '../lib/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Removed duplicated DEFAULT_SYSTEM_PROMPT definition

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useChatStore();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [tempPrompt, setTempPrompt] = useState(settings.defaultSystemPrompt);

  // Update the tempPrompt when settings change
  useEffect(() => {
    if (isOpen) {
      // The modal should always show the default system prompt from settings.
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

  const handleResetPrompt = () => {
    setTempPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const handleSave = () => {
    // Trim whitespace and check if the prompt is empty
    const trimmedPrompt = tempPrompt.trim();

    if (!trimmedPrompt) {
      // Reset to the actual default if empty
      console.warn("Attempted to save empty system prompt. Resetting to default.");
      updateSettings({
        defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT, // Use the imported default
      });
    } else {
      // Save the non-empty prompt
      updateSettings({
        defaultSystemPrompt: trimmedPrompt, // Save the trimmed version
      });
    }

    onClose();
  };

  // Use AnimatePresence to enable exit animations
  return (
    <AnimatePresence>
      {isOpen && ( // Conditionally render the modal based on isOpen
        <motion.div // Use motion.div for the backdrop
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }} // Initial state: invisible backdrop
          animate={{ opacity: 1 }} // Animate to visible backdrop
          exit={{ opacity: 0 }} // Animate out to invisible backdrop
          transition={{ duration: 0.3, ease: "easeOut" }} // Animation duration and easing
          onClick={onClose} // Close modal when clicking backdrop
        >
          <motion.div // Use motion.div for the modal content
            className={`relative ${
              isDarkMode ? 'bg-app-card-dark text-white' : 'bg-white text-gray-800'
            } rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-app`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ opacity: 0, scale: 0.9 }} // Initial state: slightly smaller and invisible
            animate={{ opacity: 1, scale: 1 }} // Animate to full size and visible
            exit={{ opacity: 0, scale: 0.9 }} // Animate out to slightly smaller and invisible
            transition={{ duration: 0.3, ease: "easeOut" }} // Animation duration and easing
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
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
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="system-prompt" className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Default System Prompt
                </label>
                <button
                  onClick={handleResetPrompt}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'text-app-purple hover:bg-app-purple/10'
                      : 'text-app-purple hover:bg-app-purple/10'
                  }`}
                  title="Reset to default prompt"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to Default
                </button>
              </div>
              <textarea
                id="system-prompt"
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                className={`w-full h-36 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-purple/50 ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                } transition-colors`}
                placeholder="Edit the system prompt..."
              />
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};