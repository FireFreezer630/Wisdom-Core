import { imageSearchTool } from './lib/findFirstImageUrl';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool'; // Added 'tool' role
  content: string | MessageContent[] | null;
  name?: string;
  function_call?: FunctionCall; // Keep for compatibility if needed, though new API uses tool_calls
  tool_call_id?: string;
}

export interface MessageContent {
  type: 'text' | 'image_url' | 'flashcard' | 'flashcard_set' | 'search_result';
  text?: string;
  image_url?: {
    url: string;
    details?: 'low' | 'high' | 'auto';
  };
  flashcard?: Flashcard;
  flashcardSet?: FlashcardSet;
  searchResult?: {
    imageUrl: string | null;
    title?: string;
    caption?: string;
    error?: string;
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

// Flashcard System Types
export interface FlashcardData {
  id: string;
  type: 'basic' | 'mcq' | 'truefalse' | 'fillintheblanks' | 'namethefollowing';
  question: string; // For basic, mcq, truefalse. For fillintheblanks, this will be the text with a placeholder. For namethefollowing, this will be the prompt.
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

export interface FillInTheBlanksFlashcard extends FlashcardData {
  type: 'fillintheblanks';
  // question property from FlashcardData will hold the text with a placeholder, e.g., "The powerhouse of the cell is the {blank}."
  // The 'question' property from FlashcardData will be used for the main text.
  // We can add a specific property for the placeholder itself if needed for rendering,
  // or assume a convention like {blank} or ____ in the question text.
  answer: string; // The word/phrase that fills the blank
}

export interface NameTheFollowingFlashcard extends FlashcardData {
  type: 'namethefollowing';
  // question property from FlashcardData will hold the prompt, e.g., "Name this part of the flower."
  // imageUrl from FlashcardData is essential here.
  answer: string; // The name of the item to be identified
}

export type Flashcard = BasicFlashcard | MCQFlashcard | TrueFalseFlashcard | FillInTheBlanksFlashcard | NameTheFollowingFlashcard;

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
                enum: ["basic", "mcq", "truefalse", "fillintheblanks", "namethefollowing"],
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
              // Properties for fillintheblanks and namethefollowing will be covered by 'answer' and 'imageUrl'
              // The 'question' field will be used for the main text/prompt.
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
  },
  {
    name: "tavily_search",
    description: "Perform a web search using Tavily API and return a summarized answer.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query." },
        topic: { type: "string", description: "Search topic: general or news.", enum: ["general", "news"] },
        max_results: { type: "integer", description: "Maximum number of results to return." }
      },
      required: ["query"]
    }
  },
  {
    // Schema for get_syllabus function
    name: "get_syllabus",
    description: "Retrieves the syllabus content for a specific academic subject by accessing its text file.",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "The academic subject for which to retrieve the syllabus (e.g., Chemistry, Physics).",
          enum: [
            "Chemistry",
            "Physics",
            "Biology",
            "Mathematics",
            "English",
            "Computer Science"
          ]
        }
      },
      required: ["subject"],
      additionalProperties: false // Ensure strictness
    },
    strict: true // Enforce schema adherence
  },
  {
    name: "create_fill_in_the_blanks",
    description: "Create a fill-in-the-blanks flashcard.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The text with a placeholder for the blank (e.g., 'The capital of France is ____.' or 'The capital of France is {blank}.'). The AI should decide on a consistent placeholder format."
        },
        answer: {
          type: "string",
          description: "The word or phrase that correctly fills the blank."
        },
        explanation: {
          type: "string",
          description: "Optional explanation for the answer."
        },
        imageUrl: {
          type: "string",
          description: "Optional URL to an image to display with the flashcard."
        }
      },
      required: ["question", "answer"]
    }
  },
  {
    name: "create_name_the_following",
    description: "Create a 'Name the Following' flashcard, typically used with an image.",
    parameters: {
      type: "object",
      properties: {
        question: { // This will serve as the prompt
          type: "string",
          description: "The prompt for the user (e.g., 'Name this organ:', 'What is shown in the image?')."
        },
        imageUrl: {
          type: "string",
          description: "URL of the image to be identified. This is highly recommended for this flashcard type."
        },
        answer: {
          type: "string",
          description: "The correct name of the item or concept to be identified."
        },
        explanation: {
          type: "string",
          description: "Optional explanation of the answer."
        }
      },
      required: ["question", "answer"] // imageUrl is highly recommended but not strictly required by the tool definition to allow flexibility.
    }
  },
  // Add the image search tool
  imageSearchTool
];