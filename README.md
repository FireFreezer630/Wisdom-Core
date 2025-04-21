# WisdomCore Flashcard System

This repository contains an interactive flashcard system for WisdomCore, a chat-based learning assistant. The system allows the AI to create various types of interactive learning elements through function calling.

## Features

- **Interactive Flashcards**: Basic question-answer flashcards that can be flipped
- **Multiple Choice Questions**: Quiz-style questions with options and feedback
- **True/False Questions**: Simple true/false statements with explanations
- **Flashcard Sets**: Collections of various flashcard types for comprehensive learning

## Implementation Details

The flashcard system is implemented using:

- OpenAI Function Calling: The AI uses function calls to create flashcards instead of embedding JSON in text
- React Components: Interactive components to render each flashcard type
- TypeScript: Strong typing for all components and data structures
- TailwindCSS: Responsive and accessible design for all flashcard components

## How It Works

1. The AI is instructed in its system prompt about the flashcard capabilities
2. When relevant, the AI can ask if the user wants to generate flashcards
3. If the user agrees, the AI calls one of the flashcard functions with the appropriate data
4. The system processes the function call and renders the flashcard component
5. The AI informs the user that a flashcard has been created
6. The user can interact with the flashcard directly in the chat interface

## Function Reference

Available flashcard functions:

- `create_flashcard`: Basic question-answer flashcard
- `create_mcq`: Multiple-choice question with options
- `create_truefalse`: True/False question
- `create_flashcard_set`: A set of multiple flashcards

## Usage

The AI is instructed to suggest creating flashcards when discussing topics that would benefit from them. Users can also explicitly ask the AI to create flashcards on specific topics.

For more detailed information about the flashcard types and implementation, see the [Flashcard System Documentation](src/components/flashcards/README.md). 