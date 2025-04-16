import OpenAI from 'openai';
import type { Message, MessageContent } from '../types';

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

export const streamCompletion = async (
  messages: Message[], 
  onChunk: (content: string) => void,
  onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void
) => {
  try {
    const stream = await client.chat.completions.create({
      messages,
      model,
      stream: true,
      stream_options: { include_usage: true }
    });

    let usage = null;
    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
      if (part.usage) {
        usage = part.usage;
      }
    }

    if (usage && onUsage) {
      onUsage(usage);
    }
  } catch (error) {
    console.error('Error in streamCompletion:', error);
    throw new Error('Failed to get AI response. Please check your configuration.');
  }
};

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