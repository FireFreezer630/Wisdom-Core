import React, { useState } from 'react';
import { MCQFlashcard as MCQFlashcardType } from '../../types';

interface MCQFlashcardProps {
  flashcard: MCQFlashcardType;
}

export function MCQFlashcard({ flashcard }: MCQFlashcardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const handleOptionSelect = (optionId: string) => {
    if (!showAnswer) {
      setSelectedOptionId(optionId);
    }
  };
  
  const handleCheckAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleReset = () => {
    setSelectedOptionId(null);
    setShowAnswer(false);
    setShowExplanation(false);
  };
  
  const isCorrect = selectedOptionId === flashcard.correctOptionId;
  
  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium text-app-purple dark:text-app-purple-light">
            Multiple Choice Question
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
        
        <div className="space-y-2 mb-4">
          {flashcard.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              disabled={showAnswer}
              className={`w-full p-3 rounded-lg text-left border transition-colors ${
                selectedOptionId === option.id
                  ? showAnswer
                    ? selectedOptionId === flashcard.correctOptionId
                      ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700'
                      : 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700'
                    : 'bg-app-purple/10 border-app-purple/30 dark:bg-app-purple/20 dark:border-app-purple/40'
                  : showAnswer && option.id === flashcard.correctOptionId
                    ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650'
              }`}
              aria-label={`Option: ${option.text}`}
            >
              <span className={`font-medium ${
                showAnswer && option.id === flashcard.correctOptionId
                  ? 'text-green-700 dark:text-green-300'
                  : showAnswer && selectedOptionId === option.id
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-700 dark:text-gray-200'
              }`}>
                {option.text}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between">
          {!showAnswer && selectedOptionId && (
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
              {isCorrect 
                ? 'You selected the right answer.' 
                : `The correct answer is: ${flashcard.options.find(o => o.id === flashcard.correctOptionId)?.text}`
              }
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