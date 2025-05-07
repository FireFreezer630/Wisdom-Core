import React, { useState } from 'react';
import type { NameTheFollowingFlashcard } from '../../types';

interface NameTheFollowingFlashcardProps {
  flashcard: NameTheFollowingFlashcard;
}

export function NameTheFollowingFlashcard({ flashcard }: NameTheFollowingFlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="flashcard p-4 border rounded-md shadow-sm bg-white dark:bg-gray-800">
      <div className="question mb-2">
        <strong>Name the Following:</strong> {flashcard.question}
      </div>
      {flashcard.imageUrl && (
        <div className="image mt-3 mb-3">
          <img src={flashcard.imageUrl} alt="Item to name" className="max-w-full h-auto rounded-md" />
        </div>
      )}
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
    </div>
  );
}