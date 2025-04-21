import { v4 as uuidv4 } from 'uuid';
import type { 
  MessageContent, 
  BasicFlashcard, 
  MCQFlashcard, 
  TrueFalseFlashcard, 
  FlashcardSet 
} from '../types';

/**
 * Validates that the parsed JSON has the required fields for a basic flashcard
 */
function validateBasicFlashcard(data: any): boolean {
  if (!data.question || typeof data.question !== 'string') {
    console.error('Basic flashcard validation failed: missing or invalid question');
    return false;
  }
  
  if (!data.answer || typeof data.answer !== 'string') {
    console.error('Basic flashcard validation failed: missing or invalid answer');
    return false;
  }
  
  return true;
}

/**
 * Validates that the parsed JSON has the required fields for an MCQ flashcard
 */
function validateMCQ(data: any): boolean {
  if (!data.question || typeof data.question !== 'string') {
    console.error('MCQ validation failed: missing or invalid question');
    return false;
  }
  
  if (!data.options || !Array.isArray(data.options) || data.options.length === 0) {
    console.error('MCQ validation failed: missing or invalid options array');
    return false;
  }
  
  if (!data.correctOptionId || typeof data.correctOptionId !== 'string') {
    console.error('MCQ validation failed: missing or invalid correctOptionId');
    return false;
  }
  
  // Verify that at least one option matches the correctOptionId
  const hasCorrectOption = data.options.some((option: any) => option.id === data.correctOptionId);
  if (!hasCorrectOption) {
    console.error('MCQ validation failed: correctOptionId does not match any option.id');
    return false;
  }
  
  return true;
}

/**
 * Validates that the parsed JSON has the required fields for a true/false flashcard
 */
function validateTrueFalse(data: any): boolean {
  if (!data.question || typeof data.question !== 'string') {
    console.error('True/false validation failed: missing or invalid question');
    return false;
  }
  
  if (typeof data.isTrue !== 'boolean') {
    console.error('True/false validation failed: missing or invalid isTrue property');
    return false;
  }
  
  return true;
}

/**
 * Handles a create_flashcard function call
 */
export function handleCreateFlashcard(args: string): MessageContent {
  try {
    const params = JSON.parse(args);
    
    if (!validateBasicFlashcard(params)) {
      throw new Error('Invalid basic flashcard data');
    }
    
    const flashcard: BasicFlashcard = {
      id: uuidv4(),
      type: 'basic',
      question: params.question,
      answer: params.answer,
      explanation: params.explanation,
      imageUrl: params.imageUrl
    };
    
    console.log('Created basic flashcard:', flashcard.id);
    return {
      type: 'flashcard',
      flashcard
    };
  } catch (error) {
    console.error('Error handling create_flashcard:', error);
    console.error('Arguments received:', args);
    throw new Error('Failed to create flashcard: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Handles a create_mcq function call
 */
export function handleCreateMCQ(args: string): MessageContent {
  try {
    const params = JSON.parse(args);
    
    if (!validateMCQ(params)) {
      throw new Error('Invalid MCQ flashcard data');
    }
    
    const flashcard: MCQFlashcard = {
      id: uuidv4(),
      type: 'mcq',
      question: params.question,
      options: params.options,
      correctOptionId: params.correctOptionId,
      explanation: params.explanation,
      imageUrl: params.imageUrl
    };
    
    console.log('Created MCQ flashcard:', flashcard.id);
    return {
      type: 'flashcard',
      flashcard
    };
  } catch (error) {
    console.error('Error handling create_mcq:', error);
    console.error('Arguments received:', args);
    throw new Error('Failed to create MCQ: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Handles a create_truefalse function call
 */
export function handleCreateTrueFalse(args: string): MessageContent {
  try {
    const params = JSON.parse(args);
    
    if (!validateTrueFalse(params)) {
      throw new Error('Invalid true/false flashcard data');
    }
    
    const flashcard: TrueFalseFlashcard = {
      id: uuidv4(),
      type: 'truefalse',
      question: params.question,
      isTrue: params.isTrue,
      explanation: params.explanation,
      imageUrl: params.imageUrl
    };
    
    console.log('Created true/false flashcard:', flashcard.id);
    return {
      type: 'flashcard',
      flashcard
    };
  } catch (error) {
    console.error('Error handling create_truefalse:', error);
    console.error('Arguments received:', args);
    throw new Error('Failed to create true/false question: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Handles a create_flashcard_set function call
 */
export function handleCreateFlashcardSet(args: string): MessageContent {
  try {
    const params = JSON.parse(args);
    
    // Validate that the required fields are present
    if (!params.title || typeof params.title !== 'string') {
      throw new Error('Missing or invalid title');
    }
    
    if (!params.cards || !Array.isArray(params.cards) || params.cards.length === 0) {
      throw new Error('Missing or invalid cards array');
    }
    
    // Check that each card has the required fields
    params.cards.forEach((card: any, index: number) => {
      if (!card.type || !['basic', 'mcq', 'truefalse'].includes(card.type)) {
        throw new Error(`Card at index ${index} has invalid type: ${card.type}`);
      }
      
      if (card.type === 'basic' && !validateBasicFlashcard(card)) {
        throw new Error(`Basic flashcard at index ${index} is invalid`);
      } else if (card.type === 'mcq' && !validateMCQ(card)) {
        throw new Error(`MCQ flashcard at index ${index} is invalid`);
      } else if (card.type === 'truefalse' && !validateTrueFalse(card)) {
        throw new Error(`True/false flashcard at index ${index} is invalid`);
      }
    });
    
    // Add unique ID to each card
    const cards = params.cards.map((card: any) => ({
      ...card,
      id: uuidv4()
    }));
    
    const flashcardSet: FlashcardSet = {
      id: uuidv4(),
      title: params.title,
      description: params.description,
      cards
    };
    
    console.log('Created flashcard set:', flashcardSet.id, 'with', cards.length, 'cards');
    return {
      type: 'flashcard_set',
      flashcardSet
    };
  } catch (error) {
    console.error('Error handling create_flashcard_set:', error);
    console.error('Arguments received:', args);
    throw new Error('Failed to create flashcard set: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Process an OpenAI function call and return appropriate flashcard content
 */
export function processFunctionCall(name: string, args: string): MessageContent | null {
  console.log(`Processing function call: ${name}`);
  
  try {
    switch (name) {
      case 'create_flashcard':
        return handleCreateFlashcard(args);
      case 'create_mcq':
        return handleCreateMCQ(args);
      case 'create_truefalse':
        return handleCreateTrueFalse(args);
      case 'create_flashcard_set':
        return handleCreateFlashcardSet(args);
      default:
        console.warn(`Unknown function call: ${name}`);
        return null;
    }
  } catch (error) {
    console.error(`Error in processFunctionCall for ${name}:`, error);
    throw error;
  }
} 