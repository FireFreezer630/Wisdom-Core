import React, { useState } from 'react';
import { MCQFlashcard as MCQFlashcardType } from '../../types';
import { MathText } from '../MathText';
import { Check, X } from 'lucide-react';

interface MCQFlashcardProps {
  flashcard: MCQFlashcardType;
}

export const MCQFlashcard: React.FC<MCQFlashcardProps> = ({ flashcard }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    if (!revealed) {
      setSelectedOptionId(optionId);
      setRevealed(true);
    }
  };

  const resetCard = () => {
    setSelectedOptionId(null);
    setRevealed(false);
  };

  return (
    <div className="w-full p-6 rounded-xl bg-white dark:bg-gray-700 shadow">
      {/* Question */}
      <div className="mb-6">
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
      </div>

      {/* Options */}
      <div className="space-y-3">
        {flashcard.options.map((option) => {
          const isCorrect = option.id === flashcard.correctOptionId;
          const isSelected = option.id === selectedOptionId;
          const showResult = revealed && (isSelected || isCorrect);
          
          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={revealed}
              className={`w-full p-4 rounded-lg text-left transition-colors relative
                ${revealed
                  ? isCorrect
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                    : isSelected
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                      : 'bg-gray-100 dark:bg-gray-800'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                border-2
                ${revealed
                  ? isCorrect
                    ? 'border-green-500'
                    : isSelected
                      ? 'border-red-500'
                      : 'border-transparent'
                  : 'border-transparent'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <MathText text={option.text} />
                </div>
                {showResult && (
                  <div className={`flex-shrink-0 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? <Check size={20} /> : <X size={20} />}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after selection) */}
      {revealed && flashcard.explanation && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Explanation</div>
          <div className="text-gray-700 dark:text-gray-300">
            <MathText text={flashcard.explanation} />
          </div>
        </div>
      )}

      {/* Reset button */}
      {revealed && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={resetCard}
            className="px-4 py-2 text-sm font-medium text-app-purple dark:text-app-purple-light 
              hover:bg-app-purple/10 dark:hover:bg-app-purple/20 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};