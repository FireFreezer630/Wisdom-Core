import React, { useState } from 'react';
import { TrueFalseFlashcard as TrueFalseFlashcardType } from '../../types';

interface TrueFalseFlashcardProps {
  flashcard: TrueFalseFlashcardType;
}

export function TrueFalseFlashcard({ flashcard }: TrueFalseFlashcardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const handleOptionSelect = (answer: boolean) => {
    if (!showAnswer) {
      setSelectedAnswer(answer);
    }
  };
  
  const handleCheckAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleReset = () => {
    setSelectedAnswer(null);
    setShowAnswer(false);
    setShowExplanation(false);
  };
  
  const isCorrect = selectedAnswer === flashcard.isTrue;
  
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-app-purple dark:text-app-purple-light">
            True or False Question
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{flashcard.question}</h3>
        
        {flashcard.imageUrl && (
          <div className="mb-4">
            <img 
              src={flashcard.imageUrl} 
              alt="Question illustration" 
              className="rounded-lg max-h-60 object-contain mx-auto"
            />
          </div>
        )}
        
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleOptionSelect(true)}
            disabled={showAnswer}
            className={`flex-1 p-3 rounded-lg text-center font-medium border transition-colors ${
              selectedAnswer === true
                ? showAnswer
                  ? selectedAnswer === flashcard.isTrue
                    ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-700 dark:text-green-300'
                    : 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 text-red-700 dark:text-red-300'
                  : 'bg-app-purple/10 border-app-purple/30 dark:bg-app-purple/20 dark:border-app-purple/40 text-app-purple dark:text-app-purple-light'
                : showAnswer && flashcard.isTrue
                  ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200'
            }`}
            aria-label="True"
          >
            True
          </button>
          
          <button
            onClick={() => handleOptionSelect(false)}
            disabled={showAnswer}
            className={`flex-1 p-3 rounded-lg text-center font-medium border transition-colors ${
              selectedAnswer === false
                ? showAnswer
                  ? selectedAnswer === flashcard.isTrue
                    ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-700 dark:text-green-300'
                    : 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 text-red-700 dark:text-red-300'
                  : 'bg-app-purple/10 border-app-purple/30 dark:bg-app-purple/20 dark:border-app-purple/40 text-app-purple dark:text-app-purple-light'
                : showAnswer && !flashcard.isTrue
                  ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200'
            }`}
            aria-label="False"
          >
            False
          </button>
        </div>
        
        <div className="flex justify-between">
          {!showAnswer && selectedAnswer !== null && (
            <button
              onClick={handleCheckAnswer}
              className="px-4 py-2 bg-app-purple hover:bg-app-purple-dark text-white rounded-lg transition-colors"
            >
              Check Answer
            </button>
          )}
          
          {showAnswer && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
        
        {showAnswer && (
          <div className={`mt-4 p-3 rounded-lg ${isCorrect 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}
          >
            <p className="font-medium">
              {isCorrect ? 'Correct!' : 'Incorrect!'} 
            </p>
            <p className="mt-1 text-sm">
              The statement is {flashcard.isTrue ? 'True' : 'False'}.
            </p>
          </div>
        )}
        
        {flashcard.explanation && showAnswer && (
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