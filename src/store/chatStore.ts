import { create } from 'zustand';
import type { Conversation, Settings, Timer, Message, MessageContent } from '../types';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  settings: Settings;
  timer: Timer;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setTimer: (timer: Partial<Timer>) => void;
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant.`;

const DEFAULT_CONVERSATION: Conversation = {
  id: crypto.randomUUID(),
  title: 'Welcome to WisdomCore',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  messages: [
    {
      role: 'assistant',
      content:
        "Hello! I'm WisdomCore, your AI knowledge companion. I'm here to help you explore any topic, answer your questions, and engage in meaningful discussions.\n\nWhat would you like to learn about today?",
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Helper function to manually serialize conversation data
const conversationToJson = (conversation: Conversation): any => {
  // Recursively convert Conversation and Message objects to plain objects
  const convertMessage = (message: Message): any => {
    const newMessage: any = {
      role: message.role,
      name: message.name,
      function_call: message.function_call,
      tool_call_id: message.tool_call_id,
    };

    if (Array.isArray(message.content)) {
      newMessage.content = message.content.map((item: MessageContent) => { // Explicitly type item
        const newItem: any = { type: item.type };
        if (item.text !== undefined) newItem.text = item.text;
        if (item.image_url !== undefined) newItem.image_url = item.image_url;
        if (item.flashcard !== undefined) newItem.flashcard = item.flashcard; // Flashcard structure should be serializable
        if (item.flashcardSet !== undefined) newItem.flashcardSet = item.flashcardSet; // FlashcardSet structure should be serializable
        if (item.searchResult !== undefined) newItem.searchResult = item.searchResult; // SearchResult structure should be serializable
        return newItem;
      });
    } else {
      newMessage.content = message.content;
    }

    return newMessage;
  };

  return {
    id: conversation.id,
    title: conversation.title,
    systemPrompt: conversation.systemPrompt,
    messages: conversation.messages.map(convertMessage),
    createdAt: conversation.createdAt.toISOString(), // Convert Date to string
    updatedAt: conversation.updatedAt.toISOString(), // Convert Date to string
  };
};


// Helper function to save state to localStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    let dataToSave = data;
    if (key === 'wisdom-core-conversations' && Array.isArray(data)) {
      // Manually serialize conversations to avoid RangeError
      dataToSave = data.map(conversationToJson);
    }

    const serializedData = JSON.stringify(dataToSave);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Helper function to load state from localStorage with custom deserialization
const loadFromLocalStorage = () => {
  try {
    const storedConversations = localStorage.getItem('wisdom-core-conversations');
    const storedSettings = localStorage.getItem('wisdom-core-settings');
    const storedActiveId = localStorage.getItem('wisdom-core-active-conversation');

    const conversations: Conversation[] = storedConversations
      ? JSON.parse(storedConversations).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt), // Convert string back to Date
          updatedAt: new Date(conv.updatedAt), // Convert string back to Date
        }))
      : []; // Start with an empty array if no conversations are stored

    const settings = storedSettings
      ? JSON.parse(storedSettings)
      : {
          defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
          darkMode: false,
          pomodoroWork: 25,
          pomodoroBreak: 5,
          pomodoroLongBreak: 15,
          pomodoroRounds: 4,
        };

    // Determine active conversation ID, ensuring it's valid
    let activeConversationId = storedActiveId;
    if (!activeConversationId || !conversations.some(conv => conv.id === activeConversationId)) {
        activeConversationId = conversations.length > 0 ? conversations[0].id : null;
    }


    return { conversations, settings, activeConversationId };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    // Return null or a state that indicates loading failed, allowing default state to be used
    return null;
  }
};

export const useChatStore = create<ChatStore>((set, get) => {
  // Load initial state from localStorage or use defaults
  const savedState = loadFromLocalStorage();

  // Ensure conversations array is not empty and activeConversationId is valid
  const initialConversations = savedState?.conversations && savedState.conversations.length > 0
    ? savedState.conversations
    : [DEFAULT_CONVERSATION]; // Use default if no conversations loaded or savedState is null

  const initialActiveConversationId = savedState?.activeConversationId && initialConversations.some(conv => conv.id === savedState.activeConversationId)
    ? savedState.activeConversationId
    : initialConversations.length > 0 ? initialConversations[0].id : null; // Use the first conversation's ID if saved ID is invalid or missing, or null if no conversations


  return {
    conversations: initialConversations,
    activeConversationId: initialActiveConversationId,
    settings: savedState?.settings || {
      defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
      darkMode: false,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      pomodoroLongBreak: 15,
      pomodoroRounds: 4,
    },
    timer: {
      endTime: null,
      isPomodoro: false,
      pomodoroState: 'work',
      currentRound: 1,
    },
    addConversation: (conversation) =>
      set((state) => {
        const newState = {
          conversations: [...state.conversations, conversation],
          activeConversationId: conversation.id,
        };
        saveToLocalStorage('wisdom-core-conversations', newState.conversations);
        saveToLocalStorage('wisdom-core-active-conversation', newState.activeConversationId);
        return newState;
      }),
    updateConversation: (id, updates) =>
      set((state) => {
        const newConversations = state.conversations.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
        );
        saveToLocalStorage('wisdom-core-conversations', newConversations);
        return { conversations: newConversations };
      }),
    deleteConversation: (id) =>
      set((state) => {
        const filteredConversations = state.conversations.filter((conv) => conv.id !== id);
        let newActiveId = state.activeConversationId === id && filteredConversations.length > 0
          ? filteredConversations[0].id // Set to the first conversation if the active one was deleted
          : state.activeConversationId; // Otherwise, keep the current active ID

        let conversationsToSave = filteredConversations;

        // If all conversations are deleted, create a new default one
        if (filteredConversations.length === 0) {
          const newDefaultConversation = {
            id: crypto.randomUUID(),
            title: 'Welcome to WisdomCore',
            systemPrompt: state.settings.defaultSystemPrompt,
            messages: [
              {
                role: 'assistant' as const,
                content:
                  "Hello! I'm WisdomCore, your AI knowledge companion. I'm here to help you explore any topic, answer your questions, and engage in meaningful discussions.\n\nWhat would you like to learn about today?",
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          conversationsToSave = [newDefaultConversation];
          newActiveId = newDefaultConversation.id;
        }

        saveToLocalStorage('wisdom-core-conversations', conversationsToSave);
        // Only update active conversation in local storage if it changed
        if (newActiveId !== state.activeConversationId) {
           saveToLocalStorage('wisdom-core-active-conversation', newActiveId);
        }


        return {
          conversations: conversationsToSave,
          activeConversationId: newActiveId,
        };
      }),
    setActiveConversation: (id) =>
      set(() => {
        saveToLocalStorage('wisdom-core-active-conversation', id);
        return { activeConversationId: id };
      }),
    updateSettings: (newSettings) =>
      set((state) => {
        const updatedSettings = { ...state.settings, ...newSettings };
        saveToLocalStorage('wisdom-core-settings', updatedSettings);
        return { settings: updatedSettings };
      }),
    setTimer: (newTimer) =>
      set((state) => ({
        timer: { ...state.timer, ...newTimer },
      })),
  };
});
