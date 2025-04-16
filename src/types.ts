export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    details?: 'low' | 'high' | 'auto';
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  defaultSystemPrompt: string;
  darkMode: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  pomodoroRounds: number;
}

export interface Timer {
  endTime: Date | null;
  isPomodoro: boolean;
  pomodoroState: 'work' | 'break' | 'longBreak';
  currentRound: number;
}