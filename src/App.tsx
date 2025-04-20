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

  const bgClass = isDarkMode 
    ? 'bg-app-bg-dark' 
    : 'bg-gradient-to-br from-app-bg-light to-app-bg';

  const headerClass = isDarkMode 
    ? 'bg-app-card-dark border-gray-700' 
    : 'bg-app-card-light border-app-bg';

  if (!activeConversation) {
    return (
      <div className={`${bgClass} min-h-screen flex text-gray-800 dark:text-white`}>
        <Sidebar />
        <main className="w-full flex items-center justify-center pl-0">
          <div className={`${headerClass} shadow-app dark:shadow-app-dark rounded-2xl p-8 max-w-md text-center`}>
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-app-purple" />
            <h1 className="text-xl font-bold mb-4">Welcome to WisdomCore</h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Select or create a conversation to start chatting
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`${bgClass} min-h-screen flex text-gray-800 dark:text-white`}>
      <Sidebar />
      
      <main className="w-full flex flex-col">
        {/* Fixed header - full width */}
        <div className={`fixed top-0 left-0 right-0 ${headerClass} border-b z-20 shadow-md`}>
          <div className="flex items-center justify-between p-4 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3 pl-16 md:pl-[calc(16rem+1rem)]">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-app-purple rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold truncate">WisdomCore</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl ${
                  isDarkMode ? 'bg-app-card-dark hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } transition-colors shadow-sm`}
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
                className={`p-2 rounded-xl relative ${
                  isDarkMode ? 'bg-app-card-dark hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } transition-colors shadow-sm`}
                aria-label="Timer settings"
              >
                <Clock className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                {timer.endTime && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-app-purple rounded-full" />
                )}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-xl ${
                  isDarkMode ? 'bg-app-card-dark hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                } transition-colors shadow-sm`}
                aria-label="Open settings"
              >
                <Settings className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content area with padding for header and input */}
        <div className="flex-1 overflow-hidden flex flex-col pt-[72px] pb-[76px] md:ml-64">
          {/* Messages container with padding at the bottom to ensure space for fixed input */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4 px-0 md:px-2 scrollbar-thin">
              {activeConversation.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
            </div>

            {error && (
              <div className="max-w-4xl mx-auto text-red-500 text-sm mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                {error}
              </div>
            )}

            {usage && (
              <div className={`max-w-4xl mx-auto text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-4 text-center`}>
                <span className="px-3 py-1 rounded-full bg-app-bg dark:bg-gray-800 inline-block">
                  Tokens used: {usage.total_tokens} 
                  (Prompt: {usage.prompt_tokens}, 
                  Completion: {usage.completion_tokens})
                </span>
              </div>
            )}
          </div>

          {/* Fixed chat input at the bottom - full width */}
          <div className={`fixed bottom-0 left-0 right-0 z-10`}>
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