export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | MessageContent[] | null;
  name?: string;
  function_call?: FunctionCall;
  tool_call_id?: string;
}

export interface MessageContent {
  type: 'text' | 'image_url' | 'flashcard' | 'flashcard_set';
  text?: string;
  image_url?: {
    url: string;
    details?: 'low' | 'high' | 'auto';
  };
  flashcard?: Flashcard;
  flashcardSet?: FlashcardSet;
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

// Flashcard System Types
export interface FlashcardData {
  id: string;
  type: 'basic' | 'mcq' | 'truefalse';
  question: string;
  imageUrl?: string;
  explanation?: string;
}

export interface BasicFlashcard extends FlashcardData {
  type: 'basic';
  answer: string;
}

export interface MCQFlashcard extends FlashcardData {
  type: 'mcq';
  options: MCQOption[];
  correctOptionId: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface TrueFalseFlashcard extends FlashcardData {
  type: 'truefalse';
  isTrue: boolean;
}

export type Flashcard = BasicFlashcard | MCQFlashcard | TrueFalseFlashcard;

export interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  cards: Flashcard[];
}

// Function Calling Types
export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface FunctionResponse {
  name: string;
  content: string;
}

// Function definitions for OpenAI
export const functionDefinitions = [
  {
    name: "create_flashcard",
    description: "Create a basic flashcard with a question and answer",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to display on the flashcard"
        },
        answer: {
          type: "string",
          description: "The answer to the question"
        },
        explanation: {
          type: "string",
          description: "Optional explanation of the answer"
        },
        imageUrl: {
          type: "string",
          description: "Optional URL to an image to display with the flashcard"
        }
      },
      required: ["question", "answer"]
    }
  },
  {
    name: "create_mcq",
    description: "Create a multiple-choice question with options",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The question to display"
        },
        options: {
          type: "array",
          description: "Array of options for the question",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Unique identifier for the option"
              },
              text: {
                type: "string",
                description: "Text of the option"
              }
            },
            required: ["id", "text"]
          }
        },
        correctOptionId: {
          type: "string",
          description: "ID of the correct option"
        },
        explanation: {
          type: "string",
          description: "Optional explanation of the correct answer"
        },
        imageUrl: {
          type: "string",
          description: "Optional URL to an image to display with the question"
        }
      },
      required: ["question", "options", "correctOptionId"]
    }
  },
  {
    name: "create_truefalse",
    description: "Create a true/false question",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The statement to evaluate as true or false"
        },
        isTrue: {
          type: "boolean",
          description: "Whether the statement is true or false"
        },
        explanation: {
          type: "string",
          description: "Optional explanation of why the statement is true or false"
        },
        imageUrl: {
          type: "string",
          description: "Optional URL to an image to display with the question"
        }
      },
      required: ["question", "isTrue"]
    }
  },
  {
    name: "create_flashcard_set",
    description: "Create a set of flashcards",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the flashcard set"
        },
        description: {
          type: "string",
          description: "Optional description of the flashcard set"
        },
        cards: {
          type: "array",
          description: "Array of flashcards in the set",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["basic", "mcq", "truefalse"],
                description: "Type of flashcard"
              },
              question: {
                type: "string",
                description: "The question or statement"
              },
              answer: {
                type: "string",
                description: "For basic type: the answer to the question"
              },
              options: {
                type: "array",
                description: "For mcq type: array of options",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" }
                  }
                }
              },
              correctOptionId: {
                type: "string",
                description: "For mcq type: ID of the correct option"
              },
              isTrue: {
                type: "boolean",
                description: "For truefalse type: whether the statement is true or false"
              },
              explanation: {
                type: "string",
                description: "Optional explanation"
              },
              imageUrl: {
                type: "string",
                description: "Optional image URL"
              }
            },
            required: ["type", "question"]
          }
        }
      },
      required: ["title", "cards"]
    }
  }
];