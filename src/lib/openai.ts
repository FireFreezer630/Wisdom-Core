import type { Message, MessageContent, FunctionCall } from '../types';
import { v4 as uuidv4 } from 'uuid';
import type { Flashcard, BasicFlashcard, MCQFlashcard, TrueFalseFlashcard, FlashcardSet } from '../types';
import { functionDefinitions } from '../types'; // Assuming functionDefinitions is defined here or imported
import { processFunctionCall } from './flashcardHandler'; // Assuming processFunctionCall is imported
import { findFirstImageUrl } from './findFirstImageUrl'; // Assuming findFirstImageUrl is imported
import { get_syllabus } from './syllabusReader'; // Import the new syllabus reader function

// Model can still be read from environment or defaulted
const model = import.meta.env.VITE_OPENAI_MODEL || 'openai'; // Default to 'openai' if not set

// Helper function to format messages for the new endpoint (assuming standard OpenAI format)
// This is simplified as the OpenAI SDK specific types are removed.
function formatMessagesForPayload(messages: Message[]) {
  return messages.map(message => {
    // Basic validation/conversion, might need more robust handling
    let content: string | Array<object> | null = null;
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
       // Filter for text/image_url, similar to previous logic but without OpenAI types
       content = message.content
         .filter(item => item.type === 'text' || (item.type === 'image_url' && item.image_url?.url))
         .map(item => {
             if (item.type === 'text') return { type: 'text', text: item.text };
             // Add explicit check for item.image_url existence after type guard
             if (item.type === 'image_url' && item.image_url) {
                 return { type: 'image_url', image_url: { url: item.image_url.url } };
             }
             return null; // Should not happen with filter, but good practice
         }).filter(item => item !== null);
    } else if (message.content === null && message.role !== 'assistant') {
        // Allow null content only for assistant message potentially ending in function call
        content = '';
    } else {
        content = message.content; // Keep null for assistant if applicable
    }


    const baseMessage: any = { role: message.role, content };

    // The new API uses 'tool_calls' in the assistant message, not 'function_call'
    // We should not include 'function_call' in the messages we send to the API
    // if (message.role === 'assistant' && message.function_call) {
    //   baseMessage.function_call = message.function_call;
    // }

    // The new API uses 'tool_call_id' and 'name' for role 'tool', not just 'name' for role 'function'
    if (message.role === 'tool' && message.tool_call_id && message.name) {
        baseMessage.tool_call_id = message.tool_call_id;
        baseMessage.name = message.name;
    } else if (message.role === 'function' && message.name) {
        // If we still have old 'function' role messages, convert them to 'tool' role for the new API
        console.warn("Converting old 'function' role message to 'tool' role for new API.");
        baseMessage.role = 'tool';
        // We don't have a tool_call_id for old function messages, this might be an issue.
        // For now, let's omit tool_call_id for converted messages, the API might handle it.
        baseMessage.name = message.name;
    }


    return baseMessage;
  }).filter(msg => msg.content !== null || msg.role === 'assistant' || msg.role === 'tool'); // Filter out messages with null content unless it's assistant or tool
}


export const streamCompletion = async (
  messages: Message[],
  onChunk: (content: string) => void,
  // onUsage is removed as the new endpoint likely doesn't provide it
  onFlashcardContent?: (flashcardContent: MessageContent) => void,
  signal?: AbortSignal
) => {
  const url = "https://text.pollinations.ai/openai"; // New endpoint
  const formattedMessages = formatMessagesForPayload(messages);

  const payload = {
    model: model, // Use the model variable
    messages: formattedMessages,
    // Note: stream is false for the initial request to check for tool_calls
    stream: false,
    // Format tools correctly for the API: wrap each function definition
    tools: functionDefinitions.map(funcDef => ({
      type: 'function',
      function: funcDef,
    })),
    tool_choice: 'auto', // Use tool_choice instead of function_call for the new API spec
  };

  let conversationHistory = [...formattedMessages]; // Keep track of messages for the second call

  const MAX_RETRIES = 3; // Maximum number of retries
  const BASE_DELAY_MS = 1000; // Initial delay in milliseconds (1 second)

  async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      // Check for abort signal before each fetch attempt
      if (signal?.aborted) {
        console.log("Fetch aborted by signal during retry.");
        throw new Error("Fetch aborted by user"); // Throw an error to break the retry loop
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        // Check for 429 or other retryable status codes
        if (response.status === 429 && retries < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retries) + Math.random() * BASE_DELAY_MS; // Exponential backoff with jitter
          console.warn(`Received 429. Retrying in ${delay}ms. Attempt ${retries + 1}/${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries + 1); // Retry
        }
        // For other non-OK responses or max retries reached, throw an error
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return response; // Return successful response

    } catch (error) {
      // Re-throw abort errors immediately
      if ((error as Error).message.includes("aborted")) {
         throw error;
      }
      // For other errors, if retries are available, retry
      if (retries < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retries) + Math.random() * BASE_DELAY_MS; // Exponential backoff with jitter
          console.warn(`Fetch failed. Retrying in ${delay}ms. Attempt ${retries + 1}/${MAX_RETRIES}. Error: ${error}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries + 1); // Retry
      }
      // If max retries reached, throw the error
      throw error;
    }
  }

  try {
    console.log("Sending initial request to:", url);
    const response = await fetchWithRetry(url, { // Use fetchWithRetry
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://image.aixboost.com",
      },
      body: JSON.stringify(payload),
      signal: signal // Pass the abort signal
    });

    const data = await response.json();
    console.log("Initial response received:", data);

    const assistantMessage = data?.choices?.[0]?.message;

    if (!assistantMessage) {
        throw new Error("Invalid response format: Missing assistant message.");
    }

    // Add the assistant's message to history
    conversationHistory.push(assistantMessage);

    // Check for tool calls
    const toolCalls = assistantMessage.tool_calls;

    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      console.log("Tool calls detected:", toolCalls);

      let toolMessages: Message[] = []; // Use Message type for tool messages

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function' && toolCall.function) {
          const functionName = toolCall.function.name;
          const functionArguments = toolCall.function.arguments;
          const toolCallId = toolCall.id;

          console.log(`Executing local function: ${functionName} with args: ${functionArguments}`);

          let functionResultContent: MessageContent | string = '';
          let functionExecutionError: string | null = null;

          try {
             // Execute the local function based on name and arguments
             // Re-using the processFunctionCall logic, which returns MessageContent
             const processedResult = await processFunctionCall(functionName, functionArguments); // Await the async function

             if (processedResult) {
                 // If it's a structured result (flashcard, search_result), pass it to onFlashcardContent
                 // Now that processedResult is awaited, we can access its properties directly
                 if (processedResult.type === 'flashcard' || processedResult.type === 'flashcard_set' || processedResult.type === 'search_result') {
                     if (onFlashcardContent) {
                         onFlashcardContent(processedResult); // Pass the structured content to the UI
                     }
                     // For the tool message content, provide a string indicating success or a summary
                     // This is what the model sees as the result of the tool call
                     if (processedResult.type === 'flashcard') functionResultContent = `Flashcard created: ${processedResult.flashcard?.question}`; // Use 'question' instead of 'front'
                     else if (processedResult.type === 'flashcard_set') functionResultContent = `Flashcard set created: ${processedResult.flashcardSet?.title} with ${processedResult.flashcardSet?.cards.length} cards.`;
                     else if (processedResult.type === 'search_result') functionResultContent = `Image search completed. Image URL: ${processedResult.searchResult?.imageUrl || 'N/A'}`;
                     else functionResultContent = `Function ${functionName} executed successfully.`; // Generic success
                 } else if (processedResult.type === 'text' && typeof processedResult.text === 'string') { // Check for type 'text' and access 'text' property
                     // If the result is simple text content
                     functionResultContent = processedResult.text;
                 } else {
                     // Fallback for other complex results - stringify or provide a summary
                     functionResultContent = `Function ${functionName} executed, result type: ${processedResult.type}.`;
                     console.warn(`Unexpected processedResult type for tool message content: ${processedResult.type}`);
                 }

             } else {
                 functionExecutionError = `Function ${functionName} did not return expected content.`;
                 functionResultContent = functionExecutionError;
             }

          } catch (error) {
            console.error(`Error executing local function ${functionName}:`, error);
            functionExecutionError = `Error executing function ${functionName}: ${error instanceof Error ? error.message : String(error)}`;
            functionResultContent = functionExecutionError; // Report error in tool message content
          }

          // Create the tool message
          const toolMessage: Message = {
            role: 'tool',
            tool_call_id: toolCallId,
            name: functionName,
            content: typeof functionResultContent === 'string' ? functionResultContent : JSON.stringify(functionResultContent), // Tool content is typically string
          };
          toolMessages.push(toolMessage);
          conversationHistory.push(toolMessage); // Add tool message to history for the second call
        } else {
            console.warn("Received unexpected tool call format:", toolCall);
        }
      }

      console.log("Sending second request with tool results.");
      // Send the second request with updated history
      const secondPayload = {
        model: model,
        messages: conversationHistory, // Use the history including assistant and tool messages
        stream: false, // Second request is also non-streaming
        // No tools/tool_choice needed in the second request
      };

      const secondResponse = await fetchWithRetry(url, { // Use fetchWithRetry
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://image.aixboost.com",
        },
        body: JSON.stringify(secondPayload),
        signal: signal // Pass the abort signal
      });

      const secondData = await secondResponse.json();
      console.log("Second response received:", secondData);

      const finalAssistantMessage = secondData?.choices?.[0]?.message;

      if (finalAssistantMessage?.content) {
          onChunk(finalAssistantMessage.content); // Deliver the final text content
      } else {
          console.warn("Second response did not contain text content.");
          // Do not call onChunk with a generic message here to suppress chat output
      }

    } else {
      // No tool calls, the first response contains the final content
      console.log("No tool calls detected. Processing first response as final.");
      if (assistantMessage?.content) {
          onChunk(assistantMessage.content); // Deliver the final text content
      } else {
          console.warn("First response did not contain text content.");
          // Do not call onChunk with a generic message here to suppress chat output
      }
    }

    console.log('Completion process complete.');

  } catch (error) {
    console.error("Error during chat completion:", error);
    // Don't call onChunk with error messages to suppress chat output
    // Re-throw if it's an abort error so App.tsx can handle it
    if ((error as Error).message.includes("aborted")) {
        console.log("Fetch aborted.");
        throw error;
    } else {
        // For other errors, just log and let the process end
        console.error("Failed to get AI response after retries.");
        // Optionally, you might want a subtle visual indicator in the UI via a different mechanism
        // than onChunk if an error persists after retries, but for now, suppress chat output.
    }
  }
};

/**
 * Helper function to check if a JSON string is complete/valid
 * This is less relevant for the non-streaming approach but kept for robustness if needed elsewhere.
 */
function isCompleteJson(jsonString: string): boolean {
  try {
    // Quick check for JSON object structure
    if (!jsonString.includes('{') || !jsonString.includes('}')) {
      return false;
    }

    // Check for balanced braces (simple check, might fail on complex strings within JSON)
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      if (char === '"' && !escaped) {
        inString = !inString;
      }

      // Basic escape handling: if current char is \, next char is escaped
      if (inString && char === '\\' && !escaped) {
          escaped = true;
          continue; // Skip to next char
      }


      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount < 0) return false; // More closing than opening
        }
      }
      escaped = false; // Reset escape status after checking char
    }

    if (braceCount !== 0) return false; // Unbalanced braces

    // Try to parse the JSON as the final check
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    // console.log("isCompleteJson check failed:", e); // Optional: log parsing errors
    return false;
  }
}

// --- Image Handling Functions (Kept as they are independent of the AI client) ---

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
      if (!event.target?.result) {
          return reject(new Error("FileReader failed to load image."));
      }
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
      img.onerror = (e) => reject(new Error(`Image loading failed: ${e}`));
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
          // Note: AbortSignal might be useful here too if uploads can be cancelled
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
            // Detail level might not be applicable for external URLs
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
          // Detail low is suitable for data URLs processed by the model
          details: 'low'
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