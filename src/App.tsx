import React, { useState, useEffect } from 'react';
import { GraduationCap, Settings, Clock, Moon, Sun } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { TimerModal } from './components/TimerModal';
import { streamCompletion, createMessageContent } from './lib/openai';
import { useChatStore } from './store/chatStore';
import { useTheme } from './lib/ThemeProvider';
import type { Message, ChatState } from './types';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatState['usage']>();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const {
    conversations,
    activeConversationId,
    updateConversation,
    settings,
    timer,
  } = useChatStore();

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);

  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!activeConversationId || !activeConversation) return;

    const messageContent = await createMessageContent(text, imageFile);
    const userMessage: Message = {
      role: 'user',
      content: messageContent
    };
    
    const updatedMessages = [...activeConversation.messages, userMessage];
    updateConversation(activeConversationId, { messages: updatedMessages });
    
    setIsLoading(true);
    setError(null);

    try {
      let assistantMessage = '';
      
      const newMessage: Message = {
        role: 'assistant',
        content: ''
      };
      
      updateConversation(activeConversationId, {
        messages: [...updatedMessages, newMessage]
      });

      // Get the conversation-specific system prompt or fall back to default
      const systemPrompt = activeConversation.systemPrompt || settings.defaultSystemPrompt;
      
      // Create the messages array with the system message first
      const messagesWithSystem: Message[] = [
        { role: 'system', content: systemPrompt },
        ...activeConversation.messages,
        userMessage
      ];

      await streamCompletion(
        messagesWithSystem,
        (chunk) => {
          assistantMessage += chunk;
          updateConversation(activeConversationId, {
            messages: [...updatedMessages, { role: 'assistant', content: assistantMessage }]
          });
        },
        (newUsage) => {
          setUsage(newUsage);
        }
      );

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError('Failed to get response. Please try again.');
    }
  };

  if (!activeConversation) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 to-purple-100 text-gray-800'} h-screen flex`}>
        <Sidebar />
        <main className="w-full flex items-center justify-center pl-0">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Select or create a conversation to start chatting</p>
        </main>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-50 to-purple-100 text-gray-800'} h-screen flex`}>
      <Sidebar />
      
      <main className="w-full flex flex-col">
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} relative z-10`}>
          <div className="flex items-center gap-3 pl-16 md:pl-16">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-purple-600 rounded-full flex items-center justify-center">
              <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold truncate">WisdomCore</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 md:h-6 md:w-6 text-yellow-300" />
              ) : (
                <Moon className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setIsTimerOpen(true)}
              className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Timer settings"
            >
              <Clock className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              {timer.endTime && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label="Open settings"
            >
              <Settings className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col p-2 md:p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-0 md:px-2">
              {activeConversation.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-4">
                {error}
              </div>
            )}

            {usage && (
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                Tokens used: {usage.total_tokens} 
                (Prompt: {usage.prompt_tokens}, 
                Completion: {usage.completion_tokens})
              </div>
            )}

            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />
    </div>
  );
}

export default App;