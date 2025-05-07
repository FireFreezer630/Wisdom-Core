import React from 'react';
import { BasicFlashcard } from './BasicFlashcard';
import { MCQFlashcard } from './MCQFlashcard';
import { TrueFalseFlashcard } from './TrueFalseFlashcard';
import { FillInTheBlanksFlashcard } from './FillInTheBlanksFlashcard'; // Import new component
import { NameTheFollowingFlashcard } from './NameTheFollowingFlashcard'; // Import new component
import { FlashcardSet } from './FlashcardSet';
import type { MessageContent, FlashcardData } from '../../types';

interface FlashcardRendererProps {
  content: MessageContent;
}

export function FlashcardRenderer({ content }: FlashcardRendererProps) {
  if (content.type === 'flashcard' && content.flashcard) {
    const { flashcard } = content;
    
    switch (flashcard.type) {
      case 'basic':
        return <BasicFlashcard flashcard={flashcard} />;
      case 'mcq':
        return <MCQFlashcard flashcard={flashcard} />;
      case 'truefalse':
        return <TrueFalseFlashcard flashcard={flashcard} />;
      case 'fillintheblanks': // Add case for fill in the blanks
        return <FillInTheBlanksFlashcard flashcard={flashcard} />;
      case 'namethefollowing': // Add case for name the following
        return <NameTheFollowingFlashcard flashcard={flashcard} />;
      default:
        return <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-300">
          Invalid flashcard type: {(flashcard as FlashcardData).type}
        </div>;
    }
  }
  
  if (content.type === 'flashcard_set' && content.flashcardSet) {
    return <FlashcardSet flashcardSet={content.flashcardSet} />;
  }
  
  return null;
} 