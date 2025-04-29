import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { GraduationCap, Settings, Clock, Moon, Sun, Square } from 'lucide-react'; // Import Square
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { TimerModal } from './components/TimerModal';
import { streamCompletion, createMessageContent } from './lib/openai';
import { useChatStore } from './store/chatStore';
import { useTheme } from './lib/ThemeProvider';
import type { Message, ChatState, MessageContent } from './types';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatState['usage']>();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const abortControllerRef = useRef<AbortController | null>(null); // Ref for AbortController

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

    // Await message content creation to ensure file processing is complete
    const messageContent = await createMessageContent(text, imageFile);

    // Only proceed if message content is not empty (e.g., if image upload failed)
    if (!messageContent || (Array.isArray(messageContent) && messageContent.length === 0)) {
        setIsLoading(false);
        setError('Failed to create message content. Please try again.');
        console.error('createMessageContent returned empty content.');
        return;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageContent // messageContent is now guaranteed to be serializable
    };

    console.log('Sending user message');
    // Update state with the fully processed user message
    const updatedMessages = [...activeConversation.messages, userMessage];
    updateConversation(activeConversationId, { messages: updatedMessages });

    setIsLoading(true);
    setError(null);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let assistantMessage = '';
      let assistantContent: MessageContent[] = [];
      let flashcardProcessed = false; // Flag to track if we've added a flashcard

      // Add a placeholder for the assistant's response immediately
      const newMessage: Message = {
        role: 'assistant',
        content: ''
      };

      // Update state with the placeholder assistant message
      updateConversation(activeConversationId, {
        messages: [...updatedMessages, newMessage]
      });

      // Get the conversation-specific system prompt or fall back to default
      const systemPrompt = activeConversation.systemPrompt || settings.defaultSystemPrompt;

      // Create the messages array for the API call
      // Filter out unsupported message types (like 'function') and content types (like flashcards)
      const messagesForApi: Message[] = activeConversation.messages
        .filter(msg => msg.role !== 'function') // Exclude function messages
        .map(msg => {
          if (Array.isArray(msg.content)) {
            // Filter out unsupported content types from the message content array
            const filteredContent = msg.content.filter(item =>
              item.type === 'text' || (item.type === 'image_url' && item.image_url?.url)
              // Add other supported types here if necessary
            );
            // Return a new message object with filtered content, or null if no supported content remains
            return { ...msg, content: filteredContent.length > 0 ? filteredContent : null };
          }
          // Include string content and other message properties as is
          return msg;
        })
        .filter(msg => msg.content !== null); // Remove messages that end up with no supported content


      const messagesWithSystem: Message[] = [
        { role: 'system', content: systemPrompt },
        ...messagesForApi, // Use the filtered messages
        userMessage // Use the fully processed user message here
      ];


      console.log('Starting streamCompletion with messages:', messagesWithSystem.length);

      await streamCompletion(
        messagesWithSystem,
        (chunk) => {
          assistantMessage += chunk;

          // Update the conversation with the current text
          if (assistantContent.length > 0) {
            // If we have flashcards, update the text part
            const textContent = assistantContent.find(c => c.type === 'text');
            if (textContent && textContent.type === 'text') {
              textContent.text = assistantMessage;
            } else {
              // Add text content if we don't have it yet
              assistantContent = [{ type: 'text', text: assistantMessage }, ...assistantContent];
            }

            updateConversation(activeConversationId, {
              messages: [...updatedMessages, {
                role: 'assistant',
                content: assistantContent
              }]
            });
          } else {
            // Simple string update if no special content yet
            updateConversation(activeConversationId, {
              messages: [...updatedMessages, {
                role: 'assistant',
                content: assistantMessage
              }]
            });
          }
        },
        (newUsage) => {
          setUsage(newUsage);
        },
        (flashcardContent) => {
          if (flashcardProcessed) {
            console.log("Ignoring duplicate flashcard content");
            return;
          }

          console.log("Received flashcard content:", flashcardContent.type);
          flashcardProcessed = true; // Mark that we've processed a flashcard

          // Add or replace flashcard content
          const existingIndex = assistantContent.findIndex(content => {
            if (flashcardContent.type === 'flashcard' && content.type === 'flashcard') {
              return flashcardContent.flashcard?.id === content.flashcard?.id;
            }
            if (flashcardContent.type === 'flashcard_set' && content.type === 'flashcard_set') {
              return flashcardContent.flashcardSet?.id === content.flashcardSet?.id;
            }
            return false;
          });

          if (existingIndex !== -1) {
            // Replace existing content
            assistantContent[existingIndex] = flashcardContent;
            console.log("Replaced existing flashcard");
          } else {
            // Add new content
            if (assistantContent.length > 0) {
              assistantContent = [...assistantContent, flashcardContent];
            } else {
              // First content, add with text if we have it
              if (assistantMessage) {
                assistantContent = [{ type: 'text', text: assistantMessage }, flashcardContent];
              } else {
                assistantContent = [flashcardContent];
              }
            }
            console.log("Added new flashcard, total content items:", assistantContent.length);
          }

          // Update the conversation with text and flashcards
          const finalMessage: Message = {
            role: 'assistant' as const,
            content: assistantContent
          };

          console.log("Updating conversation with flashcard content");
          updateConversation(activeConversationId, {
            messages: [...updatedMessages, finalMessage]
          });
        },
        controller.signal // Pass the signal here
      );

      setIsLoading(false);
      abortControllerRef.current = null; // Clear ref on successful completion
      console.log('Completed message processing. Final content:',
        assistantContent.length > 0 ? `${assistantContent.length} items` : 'Text only');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user.');
        // Optionally update the last message to indicate it was stopped
        // This might involve adding a "(Stopped)" marker or similar
      } else {
        setIsLoading(false);
        setError('Failed to get response. Please try again.');
        console.error('Error in handleSendMessage:', error);
      }
      abortControllerRef.current = null; // Clear ref on error or abort
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false); // Manually set loading to false
      abortControllerRef.current = null; // Clear ref
      console.log('Aborting AI stream.');
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
            <div className="flex items-center gap-3 md:pl-[calc(16rem+1rem)]">
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
              isLoading={isLoading} // Pass isLoading state
              onStop={handleStopGenerating} // Pass stop handler
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