import React from 'react';
import { BasicFlashcard } from './BasicFlashcard';
import { MCQFlashcard } from './MCQFlashcard';
import { TrueFalseFlashcard } from './TrueFalseFlashcard';
import { FlashcardSet } from './FlashcardSet';
import type { MessageContent } from '../../types';

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
      default:
        return <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-300">
          Invalid flashcard type
        </div>;
    }
  }
  
  if (content.type === 'flashcard_set' && content.flashcardSet) {
    return <FlashcardSet flashcardSet={content.flashcardSet} />;
  }
  
  return null;
} 