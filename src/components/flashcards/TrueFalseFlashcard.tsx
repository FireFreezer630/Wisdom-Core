import React, { useState } from 'react';
import { TrueFalseFlashcard as TrueFalseFlashcardType } from '../../types';
import { MathText } from '../MathText';
import { Check, X } from 'lucide-react';

interface TrueFalseFlashcardProps {
  flashcard: TrueFalseFlashcardType;
}

export const TrueFalseFlashcard: React.FC<TrueFalseFlashcardProps> = ({ flashcard }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleAnswer = (answer: boolean) => {
    if (!revealed) {
      setSelectedAnswer(answer);
      setRevealed(true);
    }
  };

  const resetCard = () => {
    setSelectedAnswer(null);
    setRevealed(false);
  };

  return (
    <div className="w-full p-6 rounded-xl bg-white dark:bg-gray-700 shadow">
      {/* Question */}
      <div className="mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Statement</div>
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

      {/* True/False buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(true)}
          disabled={revealed}
          className={`p-4 rounded-lg text-center transition-colors relative
            ${revealed
              ? flashcard.isTrue
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                : selectedAnswer === true
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
            border-2
            ${revealed
              ? flashcard.isTrue
                ? 'border-green-500'
                : selectedAnswer === true
                  ? 'border-red-500'
                  : 'border-transparent'
              : 'border-transparent'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>True</span>
            {revealed && selectedAnswer === true && (
              <span className={flashcard.isTrue ? 'text-green-500' : 'text-red-500'}>
                {flashcard.isTrue ? <Check size={20} /> : <X size={20} />}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => handleAnswer(false)}
          disabled={revealed}
          className={`p-4 rounded-lg text-center transition-colors relative
            ${revealed
              ? !flashcard.isTrue
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                : selectedAnswer === false
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
            border-2
            ${revealed
              ? !flashcard.isTrue
                ? 'border-green-500'
                : selectedAnswer === false
                  ? 'border-red-500'
                  : 'border-transparent'
              : 'border-transparent'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>False</span>
            {revealed && selectedAnswer === false && (
              <span className={!flashcard.isTrue ? 'text-green-500' : 'text-red-500'}>
                {!flashcard.isTrue ? <Check size={20} /> : <X size={20} />}
              </span>
            )}
          </div>
        </button>
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