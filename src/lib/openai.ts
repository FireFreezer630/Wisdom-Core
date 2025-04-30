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
    // OpenAI API expects content as a string or an array of content parts (for multimodal)
    let openAIContent: string | Array<OpenAI.ChatCompletionContentPart> | null = null;

    if (typeof message.content === 'string') {
      openAIContent = message.content;
    } else if (Array.isArray(message.content)) {
      // Filter out unsupported content types before passing to OpenAI
      const filteredContent = message.content.filter(item =>
        item.type === 'text' || (item.type === 'image_url' && item.image_url?.url)
        // Add other supported OpenAI content types here if needed in the future
      );
      // Cast the filtered array to the expected OpenAI type.
      // If filteredContent is empty, this will be an empty array, which is acceptable for OpenAI.
      openAIContent = filteredContent as Array<OpenAI.ChatCompletionContentPart>;
    } else if (message.content === null) {
      openAIContent = ''; // Handle null content
    } else {
       // Fallback for unexpected content types, stringify as before
       console.warn('Unexpected message content type:', typeof message.content, message.content);
       openAIContent = JSON.stringify(message.content);
    }

    // Return the correct message object structure based on role
    if (message.role === 'system') {
      // System content must be string or text parts, not null
      const systemContent = openAIContent === null ? '' : openAIContent;
      return {
        role: 'system' as const, // Explicitly cast to literal type
        content: systemContent as string | Array<OpenAI.Chat.Completions.ChatCompletionContentPartText>, // System content must be string or text parts
      };
    } else if (message.role === 'user') {
       return {
         role: 'user' as const, // Explicitly cast to literal type
         content: openAIContent as string | Array<OpenAI.ChatCompletionContentPart>, // User content can be string or array
       };
    } else if (message.role === 'assistant') {
       return {
         role: 'assistant' as const, // Explicitly cast to literal type
         content: openAIContent as string | null, // Assistant content is typically string or null
         function_call: message.function_call, // Include function_call for assistant messages
       };
    } else if (message.role === 'function') {
       return {
         role: 'function' as const, // Explicitly cast to literal type
         content: openAIContent as string | null, // Function content is typically string or null
         name: message.name || '', // Function messages require a name
       };
    }

    // Fallback for unknown roles (shouldn't happen with defined types)
    console.warn('Unknown message role:', message.role);
    return {
      role: 'user' as const, // Default to user role for safety, explicitly cast
      content: 'Error: Unknown message role',
    };
  });
}

export const streamCompletion = async (
  messages: Message[],
  onChunk: (content: string) => void,
  onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void,
  onFlashcardContent?: (flashcardContent: MessageContent) => void,
  signal?: AbortSignal // Add AbortSignal parameter
) => {
  try {
    console.log('Starting completion stream with functions enabled');
    const openAIMessages = convertToOpenAIMessages(messages);
    
    const stream = await client.chat.completions.create({
      messages: openAIMessages,
      model,
      stream: true,
      max_tokens: 8000, // Increased token limit for larger flashcard sets
      temperature: 0.7,
      stream_options: { include_usage: true },
      functions: functionDefinitions,
      function_call: 'auto',
      // Removed signal from here
    }, { signal: signal }); // Added options object here

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
        // Handle Tavily web search function
        if (accumulatedFunctionCall.name === 'tavily_search') {
          const args = JSON.parse(accumulatedFunctionCall.arguments);
          const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
          if (!tavilyKey) {
            accumulatedText += "\n\nError: Missing Tavily API key.";
            onChunk("\n\nError: Missing Tavily API key.");
            functionCallProcessed = true;
            return true;
          }
          const requestBody = {
            query: args.query,
            topic: args.topic || 'general',
            search_depth: 'basic',
            chunks_per_source: 3,
            max_results: args.max_results || 3,
            time_range: null,
            days: 7,
            include_answer: true,
            include_raw_content: false,
            include_images: false,
            include_image_descriptions: false,
            include_domains: [],
            exclude_domains: [],
          };
          try {
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tavilyKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });
            const data = await response.json();
            functionCallProcessed = true;
            if (data.answer) {
              accumulatedText += `\n\n${data.answer}`;
              onChunk(`\n\n${data.answer}`);
            } else {
              accumulatedText += "\n\nNo results found.";
              onChunk("\n\nNo results found.");
            }
          } catch (err) {
            accumulatedText += `\n\nError calling Tavily: ${err}`;
            onChunk(`\n\nError calling Tavily: ${err}`);
            functionCallProcessed = true;
          }
          return true;
        }
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

// Helper function to get Data URL (original functionality)
const getImageDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to resize image if needed and return data URL
const resizeImageIfNeeded = async (file: File): Promise<string> => {
  const MAX_DIMENSION = 2000; // Max long side dimension from OpenAI docs
  const TARGET_QUALITY = 0.7; // JPEG quality for resizing

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        if (Math.max(width, height) <= MAX_DIMENSION) {
          // No resize needed, return original data URL
          resolve(event.target?.result as string);
          return;
        }

        // Calculate new dimensions
        let newWidth, newHeight;
        if (width > height) {
          newWidth = MAX_DIMENSION;
          newHeight = Math.round((height * MAX_DIMENSION) / width);
        } else {
          newHeight = MAX_DIMENSION;
          newWidth = Math.round((width * MAX_DIMENSION) / height);
        }

        // Resize using canvas
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Get resized data URL (use JPEG for better compression)
        const resizedDataUrl = canvas.toDataURL('image/jpeg', TARGET_QUALITY);
        console.log(`Image resized from ${width}x${height} to ${newWidth}x${newHeight}`);
        resolve(resizedDataUrl);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
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
    // Define the maximum file size based on OpenAI documentation (20MB)
    const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

    if (imageFile.size > MAX_FILE_SIZE_BYTES) {
      console.warn('Image file size exceeds 20MB limit. Attempting upload to temporary service.');
      
      const uploadUrl = 'https://tmpfiles.org/api/v1/upload';
      const formData = new FormData();
      formData.append('file', imageFile);

      try {
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        // Assuming the API returns a JSON with a 'data.url' field for the uploaded image
        const imageUrl = result?.data?.url;

        if (imageUrl) {
          content.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
            details: 'low' // Corrected property name from detail to details
          }
        });
           // Optionally, add a user-facing message about the successful upload
          content.push({ type: 'text', text: `(Note: Image "${imageFile.name}" uploaded successfully.)` });
        } else {
           throw new Error('Upload successful but no URL found in response.');
        }

      } catch (error) {
        console.error('Error uploading image:', error);
        // Add a user-facing message about the upload failure
        content.push({ type: 'text', text: `(Error uploading image "${imageFile.name}": ${error instanceof Error ? error.message : String(error)})` });
        // Do not add the image if upload fails
      }

    } else {
      // Use data URL for smaller images, resizing if dimensions are too large
      try {
        const imageUrl = await resizeImageIfNeeded(imageFile);
        content.push({
        type: 'image_url',
        image_url: {
          url: imageUrl,
          details: 'low' // Corrected property name from detail to details
        }
      });
      } catch (error) {
         console.error('Error processing image for data URL:', error);
         content.push({ type: 'text', text: `(Error processing image "${imageFile.name}": ${error instanceof Error ? error.message : String(error)})` });
      }
    }
  }
  
  return content;
};

// Note: Using tmpfiles.org for frontend uploads means no API key is directly exposed,
// but reliance on a third-party service for temporary storage is introduced.
// For persistent storage or more control, a backend upload is recommended.