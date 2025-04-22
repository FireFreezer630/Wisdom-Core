import React, { useState } from 'react';
import { BasicFlashcard as BasicFlashcardType } from '../../types';
import { MathText } from '../MathText';

interface BasicFlashcardProps {
  flashcard: BasicFlashcardType;
}

export const BasicFlashcard: React.FC<BasicFlashcardProps> = ({ flashcard }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      onClick={toggleFlip}
      className="relative w-full cursor-pointer"
      style={{ perspective: '1000px', minHeight: '200px' }}
    >
      <div 
        className={`w-full transition-transform duration-500 transform-gpu ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front side (Question) */}
        <div 
          className={`absolute w-full p-6 rounded-xl shadow transition-opacity duration-500 backface-hidden
            ${isFlipped ? 'opacity-0' : 'opacity-100'}
            bg-white dark:bg-gray-700`}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Question</div>
          <div className="text-gray-900 dark:text-white">
            <MathText text={flashcard.question} />
          </div>
          {flashcard.imageUrl && (
            <img 
              src={flashcard.imageUrl} 
              alt="Question illustration" 
              className="mt-4 max-w-full h-auto rounded-lg"
            />
          )}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Click to reveal answer
          </div>
        </div>

        {/* Back side (Answer) */}
        <div 
          className={`absolute w-full p-6 rounded-xl shadow transition-opacity duration-500 backface-hidden rotate-y-180
            ${isFlipped ? 'opacity-100' : 'opacity-0'}
            bg-white dark:bg-gray-700`}
        >
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Answer</div>
          <div className="text-gray-900 dark:text-white">
            <MathText text={flashcard.answer} />
          </div>
          {flashcard.explanation && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Explanation</div>
              <div className="text-gray-700 dark:text-gray-300">
                <MathText text={flashcard.explanation} />
              </div>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Click to see question
          </div>
        </div>
      </div>
    </div>
  );
};