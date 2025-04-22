import OpenAI from 'openai';
import type { Message, MessageContent, FunctionCall } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, BasicFlashcard, MCQFlashcard, TrueFalseFlashcard, FlashcardSet } from '../types';
import { functionDefinitions } from '../types';
import { processFunctionCall } from './flashcardHandler';
import { findFirstImageUrl } from './findFirstImageUrl';

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
      max_tokens: 2048, // Increased token limit for larger flashcard sets
      temperature: 0.7,
      stream_options: { include_usage: true },
      functions: functionDefinitions,
      function_call: 'auto'
    });

    let usage = null;
    let accumulatedText = '';
    let accumulatedFunctionCall: Partial<FunctionCall> = {};
    let functionCallInProgress = false;
    let functionCallProcessed = false;
    
    // Helper function to process function calls and return appropriate message
    const processFunctionCallResult = async () => {
      if (!accumulatedFunctionCall.name || 
          !accumulatedFunctionCall.arguments || 
          functionCallProcessed) {
        return false;
      }

      try {
        // Handle image search function
        if (accumulatedFunctionCall.name === 'findFirstImageUrl') {
          const args = JSON.parse(accumulatedFunctionCall.arguments);
          const result = await findFirstImageUrl(args);
          
          if (result) {
            functionCallProcessed = true;
            
            if (result.error) {
              accumulatedText += `\n\nI couldn't find an image: ${result.error}`;
              onChunk(`\n\nI couldn't find an image: ${result.error}`);
            } else if (result.imageUrl) {
              if (onFlashcardContent) {
                onFlashcardContent({
                  type: 'search_result',
                  searchResult: result
                });
              }
              
              accumulatedText += `\n\nI found an image${result.title ? ` titled "${result.title}"` : ''}.`;
              onChunk(`\n\nI found an image${result.title ? ` titled "${result.title}"` : ''}.`);
            }
            
            return true;
          }
        }
        // Handle flashcard functions
        else {
          const flashcardContent = processFunctionCall(
            accumulatedFunctionCall.name, 
            accumulatedFunctionCall.arguments
          );
          
          if (flashcardContent) {
            console.log('Flashcard generated successfully:', flashcardContent.type);
            functionCallProcessed = true;
            if (onFlashcardContent) {
              onFlashcardContent(flashcardContent);
            }
            
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
                const set = (flashcardContent as { flashcardSet: FlashcardSet }).flashcardSet;
                responseText = `I've created a set of ${set.cards.length} flashcards about "${set.title}" for you.`;
                break;
            }
            
            if (responseText && !accumulatedText.includes(responseText)) {
              accumulatedText += '\n\n' + responseText;
              onChunk('\n\n' + responseText);
            }
            
            return true;
          }
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
      
      if (functionCallInProgress && (isEndOfFunctionCall || hasValidJson)) {
        const logMessage = isEndOfFunctionCall
          ? 'Function call complete. Processing at end of stream...'
          : 'Complete JSON detected in stream. Processing function call early...';
        
        console.log(logMessage);
        
        await processFunctionCallResult();
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
 * Helper function to check if a JSON string is complete/valid
 */
function isCompleteJson(jsonString: string): boolean {
  try {
    // Quick check for JSON object structure
    if (!jsonString.includes('{') || !jsonString.includes('}')) {
      return false;
    }
    
    // Check for balanced braces
    let braceCount = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      escaped = inString && char === '\\' && !escaped;
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount < 0) return false;
        }
      }
    }
    
    if (braceCount !== 0) return false;
    
    // Try to parse the JSON
    JSON.parse(jsonString);
    return true;
  } catch (e) {
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