import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlashcardSet as FlashcardSetType } from '../../types';
import { BasicFlashcard } from './BasicFlashcard';
import { MCQFlashcard } from './MCQFlashcard';
import { TrueFalseFlashcard } from './TrueFalseFlashcard';

interface FlashcardSetProps {
  flashcardSet: FlashcardSetType;
}

export function FlashcardSet({ flashcardSet }: FlashcardSetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleNext = () => {
    if (currentIndex < flashcardSet.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleSelect = (index: number) => {
    setCurrentIndex(index);
  };
  
  const currentCard = flashcardSet.cards[currentIndex];
  
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{flashcardSet.title}</h2>
          {flashcardSet.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{flashcardSet.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`p-2 rounded-full ${
              currentIndex === 0 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-app-purple dark:text-app-purple-light hover:bg-app-purple/10 dark:hover:bg-app-purple/20'
            }`}
            aria-label="Previous card"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Card {currentIndex + 1} of {flashcardSet.cards.length}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === flashcardSet.cards.length - 1}
            className={`p-2 rounded-full ${
              currentIndex === flashcardSet.cards.length - 1 
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                : 'text-app-purple dark:text-app-purple-light hover:bg-app-purple/10 dark:hover:bg-app-purple/20'
            }`}
            aria-label="Next card"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="mb-4 overflow-auto py-2">
          <div className="flex gap-2">
            {flashcardSet.cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleSelect(index)}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index === currentIndex
                    ? 'bg-app-purple text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                aria-label={`Go to card ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        
        {currentCard.type === 'basic' && (
          <BasicFlashcard flashcard={currentCard} />
        )}
        
        {currentCard.type === 'mcq' && (
          <MCQFlashcard flashcard={currentCard} />
        )}
        
        {currentCard.type === 'truefalse' && (
          <TrueFalseFlashcard flashcard={currentCard} />
        )}
      </div>
    </div>
  );
} 