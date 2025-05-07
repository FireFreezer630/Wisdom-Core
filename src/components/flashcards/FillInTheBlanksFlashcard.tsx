import React, { useState } from 'react';
import type { FillInTheBlanksFlashcard } from '../../types';

interface FillInTheBlanksFlashcardProps {
  flashcard: FillInTheBlanksFlashcard;
}

export function FillInTheBlanksFlashcard({ flashcard }: FillInTheBlanksFlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  // Simple rendering for now - will need to handle placeholder display
  const displayedQuestion = flashcard.question.replace(/\{blank\}/g, '______'); // Replace {blank} with underscores

  return (
    <div className="flashcard p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800">
      <div className="question mb-2">
        <strong>Fill in the Blank:</strong> {displayedQuestion}
      </div>
      {showAnswer && (
        <div className="answer mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <strong>Answer:</strong> {flashcard.answer}
        </div>
      )}
      {flashcard.explanation && (
         <div className="explanation mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
           <strong>Explanation:</strong> {flashcard.explanation}
         </div>
      )}
      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="mt-3 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-sm"
      >
        {showAnswer ? 'Hide Answer' : 'Show Answer'}
      </button>
      {flashcard.imageUrl && (
        <div className="image mt-3">
          <img src={flashcard.imageUrl} alt="Flashcard related image" className="max-w-full h-auto rounded-md" />
        </div>
      )}
    </div>
  );
}