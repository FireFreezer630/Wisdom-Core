import React, { useState } from 'react';
import { BasicFlashcard as BasicFlashcardType } from '../../types';

interface BasicFlashcardProps {
  flashcard: BasicFlashcardType;
}

export function BasicFlashcard({ flashcard }: BasicFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const toggleFlip = () => setIsFlipped(!isFlipped);
  
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-app-purple dark:text-app-purple-light">
            Flashcard
          </div>
          <button
            onClick={toggleFlip}
            className="px-3 py-1 bg-app-purple/10 hover:bg-app-purple/20 text-app-purple dark:text-app-purple-light rounded-lg text-sm font-medium transition-colors"
            aria-label={isFlipped ? "Show Question" : "Show Answer"}
          >
            {isFlipped ? "Show Question" : "Show Answer"}
          </button>
        </div>
        
        <div className={`transition duration-300 ${isFlipped ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Question:</h3>
          <p className="text-gray-700 dark:text-gray-300">{flashcard.question}</p>
          
          {flashcard.imageUrl && (
            <div className="mt-4">
              <img 
                src={flashcard.imageUrl} 
                alt="Flashcard illustration" 
                className="rounded-lg max-h-60 object-contain mx-auto"
              />
            </div>
          )}
        </div>
        
        <div className={`transition duration-300 ${isFlipped ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Answer:</h3>
          <p className="text-gray-700 dark:text-gray-300">{flashcard.answer}</p>
        </div>
        
        {flashcard.explanation && (
          <div className="mt-4">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-sm text-app-purple dark:text-app-purple-light font-medium flex items-center gap-1"
            >
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
            </button>
            
            {showExplanation && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">{flashcard.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 