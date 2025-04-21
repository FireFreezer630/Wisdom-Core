import OpenAI from 'openai';
import type { Message, MessageContent, FunctionCall } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, BasicFlashcard, MCQFlashcard, TrueFalseFlashcard, FlashcardSet } from '../types';
import { functionDefinitions } from '../types';
import { processFunctionCall } from './flashcardHandler';

const baseURL = import.meta.env.VITE_OPENAI_API_ENDPOINT;
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const model = import.meta.env.VITE_OPENAI_MODEL;

if (!baseURL || !apiKey || !model) {
  throw new Error('Missing required environment variables. Please check your .env file.');
}

const client = new OpenAI({
  baseURL,
  apiKey,
  dangerouslyAllowBrowser: true
});

// Helper function to convert our Message type to OpenAI's ChatCompletionMessageParam
function convertToOpenAIMessages(messages: Message[]) {
  return messages.map(message => {
    // Handle function messages
    if (message.role === 'function') {
      return {
        role: 'function' as const,
        content: typeof message.content === 'string' ? message.content : '',
        name: message.name || '',
      };
    }
    
    // Handle regular messages
    return {
      role: message.role as 'system' | 'user' | 'assistant',
      content: typeof message.content === 'string' 
        ? message.content 
        : message.content === null ? '' : JSON.stringify(message.content),
      function_call: message.function_call,
    };
  });
}

export const streamCompletion = async (
  messages: Message[], 
  onChunk: (content: string) => void,
  onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void,
  onFlashcardContent?: (flashcardContent: MessageContent) => void
) => {
  try {
    console.log('Starting completion stream with functions enabled');
    const openAIMessages = convertToOpenAIMessages(messages);
    
    const stream = await client.chat.completions.create({
      messages: openAIMessages,
      model,
      stream: true,
      stream_options: { include_usage: true },
      functions: functionDefinitions,
      function_call: 'auto'
    });

    let usage = null;
    let accumulatedText = '';
    let accumulatedFunctionCall: Partial<FunctionCall> = {};
    let functionCallInProgress = false;
    let functionCallProcessed = false; // Flag to track processed function calls
    
    // Helper function to process flashcard content and return appropriate message
    const processFlashcardFunction = () => {
      if (!accumulatedFunctionCall.name || 
          !accumulatedFunctionCall.arguments || 
          !onFlashcardContent || 
          functionCallProcessed) {
        return false;
      }
      
      try {
        const flashcardContent = processFunctionCall(
          accumulatedFunctionCall.name, 
          accumulatedFunctionCall.arguments
        );
        
        if (flashcardContent) {
          console.log('Flashcard generated successfully:', flashcardContent.type);
          functionCallProcessed = true; // Mark as processed
          onFlashcardContent(flashcardContent);
          
          // Add response text to indicate successful flashcard creation
          let responseText = '';
          switch (accumulatedFunctionCall.name) {
            case 'create_flashcard':
              responseText = 'I\'ve created a flashcard for you.';
              break;
            case 'create_mcq':
              responseText = 'I\'ve created a multiple-choice question for you.';
              break;
            case 'create_truefalse':
              responseText = 'I\'ve created a true/false question for you.';
              break;
            case 'create_flashcard_set':
              responseText = 'I\'ve created a set of flashcards for you.';
              break;
          }
          
          if (responseText && !accumulatedText.includes(responseText)) {
            accumulatedText += '\n\n' + responseText;
            onChunk('\n\n' + responseText);
          }
          
          return true;
        }
      } catch (error) {
        console.error('Error processing function call:', error);
      }
      
      return false;
    };
    
    for await (const part of stream) {
      // Debug logging
      if (part.choices[0]?.delta?.function_call) {
        console.log('Function call delta received:', part.choices[0].delta.function_call);
      }
      
      // Handle normal content
      const content = part.choices[0]?.delta?.content || '';
      if (content) {
        accumulatedText += content;
        onChunk(content);
      }
      
      // Handle function calling
      const functionCall = part.choices[0]?.delta?.function_call;
      if (functionCall) {
        functionCallInProgress = true;
        
        if (functionCall.name) {
          accumulatedFunctionCall.name = functionCall.name;
          console.log('Function name received:', functionCall.name);
        }
        
        if (functionCall.arguments) {
          accumulatedFunctionCall.arguments = 
            (accumulatedFunctionCall.arguments || '') + functionCall.arguments;
          console.log('Function arguments chunk received, length:', functionCall.arguments.length);
        }
      }
      
      // Try to process the function call under certain conditions
      const isEndOfFunctionCall = part.choices[0]?.finish_reason === 'function_call';
      const hasValidJson = accumulatedFunctionCall.arguments && isCompleteJson(accumulatedFunctionCall.arguments);
      
      // Process at end of stream or if we detect complete JSON
      if (functionCallInProgress && (isEndOfFunctionCall || hasValidJson)) {
        const logMessage = isEndOfFunctionCall
          ? 'Function call complete. Processing at end of stream...'
          : 'Complete JSON detected in stream. Processing function call early...';
        
        console.log(logMessage);
        
        // Process the flashcard function
        processFlashcardFunction();
      } else if (functionCallInProgress && accumulatedFunctionCall.arguments) {
        console.log('Function call in progress, waiting for complete data...');
      }
      
      if (part.usage) {
        usage = part.usage;
      }
    }
    
    console.log('Stream completed. Final function call state:', 
      functionCallInProgress ? 'Function call detected' : 'No function call',
      functionCallProcessed ? '(processed)' : '(not processed)');

    if (usage && onUsage) {
      onUsage(usage);
    }
  } catch (error) {
    console.error('Error in streamCompletion:', error);
    throw new Error('Failed to get AI response. Please check your configuration.');
  }
};

/**
 * Helper function to check if a JSON string is complete/valid and possibly a flashcard
 */
function isCompleteJson(jsonString: string): boolean {
  try {
    // First do a quick check for common JSON patterns
    if (!jsonString.includes('{') || !jsonString.includes('}')) {
      return false;
    }
    
    // Check for balanced braces
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      // Handle strings and escaped characters
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      escaped = inString && char === '\\' && !escaped;
      
      // Only count braces when not inside a string
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          // Closing brace without an opening brace means malformed JSON
          if (braceCount < 0) {
            return false;
          }
        }
      }
    }
    
    // If braces aren't balanced, it's incomplete
    if (braceCount !== 0) {
      return false;
    }
    
    // Try to actually parse it
    const data = JSON.parse(jsonString);
    
    // Check if it looks like a flashcard-related structure
    const isFlashcardRelated = 
      // Basic flashcard
      (data.type === 'basic' && typeof data.question === 'string' && typeof data.answer === 'string') ||
      // MCQ flashcard
      (data.type === 'mcq' && typeof data.question === 'string' && Array.isArray(data.options)) ||
      // True/False flashcard
      (data.type === 'truefalse' && typeof data.question === 'string' && typeof data.isTrue === 'boolean') ||
      // Flashcard set
      (data.cards && Array.isArray(data.cards) && typeof data.title === 'string');
    
    // If we get here and it looks like a flashcard, it's valid
    if (isFlashcardRelated) {
      console.log('Valid flashcard JSON detected');
      return true;
    }
    
    // It's valid JSON but not a flashcard
    return false;
  } catch (e) {
    // If it fails to parse, it's incomplete
    return false;
  }
}

export const getImageDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const createMessageContent = async (text: string, imageFile?: File): Promise<MessageContent[]> => {
  const content: MessageContent[] = [];
  
  if (text) {
    content.push({ type: 'text', text });
  }
  
  if (imageFile) {
    const imageUrl = await getImageDataUrl(imageFile);
    content.push({
      type: 'image_url',
      image_url: {
        url: imageUrl,
        details: 'auto'
      }
    });
  }
  
  return content;
};

/**
 * Parse flashcard JSON from assistant responses
 * @param text Assistant response text that may contain JSON
 * @returns Array of MessageContent objects for any flashcards found
 */
export const parseFlashcards = (text: string) => {
  // More robust JSON extraction regex
  // This pattern attempts to find complete JSON objects by properly balancing braces
  const extractJsonObjects = (text: string): string[] => {
    const results: string[] = [];
    let braceCount = 0;
    let currentObject = '';
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Handle strings and escaped characters
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      escaped = inString && char === '\\' && !escaped;
      
      // Only count braces when not inside a string
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            currentObject = '';
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          // If we've closed all braces, we have a complete object
          if (braceCount === 0 && currentObject.length > 0) {
            results.push(currentObject + '}');
          }
        }
      }
      
      // Add character to current object if we're inside a JSON object
      if (braceCount > 0 && (currentObject.length > 0 || char === '{')) {
        currentObject += char;
      }
    }
    
    return results;
  };
  
  const potentialJsons = extractJsonObjects(text);
  
  if (potentialJsons.length === 0) return [];
  
  const contents: MessageContent[] = [];
  
  for (const jsonString of potentialJsons) {
    try {
      // Attempt to parse as JSON
      const data = JSON.parse(jsonString);
      
      // Validate the structure to ensure it's actually a flashcard
      const isValidBasicFlashcard = 
        data.type === 'basic' && 
        typeof data.question === 'string' && 
        typeof data.answer === 'string';
        
      const isValidMCQ = 
        data.type === 'mcq' && 
        typeof data.question === 'string' && 
        Array.isArray(data.options) &&
        typeof data.correctOptionId === 'string' &&
        data.options.every((opt: any) => 
          typeof opt.id === 'string' && typeof opt.text === 'string'
        );
        
      const isValidTrueFalse = 
        data.type === 'truefalse' && 
        typeof data.question === 'string' && 
        typeof data.isTrue === 'boolean';
        
      const isValidFlashcardSet = 
        data.cards && 
        Array.isArray(data.cards) && 
        typeof data.title === 'string' &&
        data.cards.length > 0 &&
        data.cards.every((card: any) => 
          card.type && 
          typeof card.question === 'string' && 
          (
            (card.type === 'basic' && typeof card.answer === 'string') ||
            (card.type === 'mcq' && Array.isArray(card.options) && typeof card.correctOptionId === 'string') ||
            (card.type === 'truefalse' && typeof card.isTrue === 'boolean')
          )
        );
      
      // Check if it's a valid flashcard object
      if (isValidBasicFlashcard || isValidMCQ || isValidTrueFalse) {
        // Add ID if not present
        const flashcard = {
          ...data,
          id: data.id || uuidv4()
        };
        
        // Add to content array as a flashcard
        contents.push({
          type: 'flashcard',
          flashcard
        });
      }
      // Check if it's a valid flashcard set
      else if (isValidFlashcardSet) {
        // Add ID to set if not present
        const flashcardSet = {
          ...data,
          id: data.id || uuidv4()
        };
        
        // Add IDs to cards if not present
        flashcardSet.cards = flashcardSet.cards.map((card: any) => ({
          ...card,
          id: card.id || uuidv4()
        }));
        
        // Add to content array as a flashcard set
        contents.push({
          type: 'flashcard_set',
          flashcardSet
        });
      }
    } catch (e) {
      // Skip invalid JSON
      console.error('Error parsing flashcard JSON:', e);
      continue;
    }
  }
  
  return contents;
};