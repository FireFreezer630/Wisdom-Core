# JSON to Flashcard/MCQ Rendering System

This system allows AI to create interactive flashcards, multiple-choice questions, or true/false questions in the chat interface using function calling.

## Function Calling Implementation

The system uses OpenAI's function calling capabilities to allow the AI to create flashcards directly. Instead of embedding JSON in its text responses, the AI can call specific functions to create different types of flashcards.

Available functions:
- `create_flashcard` - Creates a basic flashcard with a question and answer
- `create_mcq` - Creates a multiple-choice question
- `create_truefalse` - Creates a true/false question
- `create_flashcard_set` - Creates a set of flashcards

When the AI calls one of these functions, the system processes the call and renders the appropriate flashcard component.

## Supported Flashcard Types

### 1. Basic Flashcard

A simple question and answer flashcard.

```json
// Function: create_flashcard
{
  "question": "What is the capital of France?",
  "answer": "Paris",
  "explanation": "Paris has been the capital of France since 987 CE."
}
```

### 2. Multiple Choice Question (MCQ)

A question with multiple options where one is correct.

```json
// Function: create_mcq
{
  "question": "Which planet is known as the Red Planet?",
  "options": [
    { "id": "a", "text": "Venus" },
    { "id": "b", "text": "Mars" },
    { "id": "c", "text": "Jupiter" },
    { "id": "d", "text": "Saturn" }
  ],
  "correctOptionId": "b",
  "explanation": "Mars appears red because its surface contains iron oxide (rust)."
}
```

### 3. True/False Question

A statement that is either true or false.

```json
// Function: create_truefalse
{
  "question": "The Great Wall of China is visible from space with the naked eye.",
  "isTrue": false,
  "explanation": "Contrary to popular belief, the Great Wall of China is not visible from space with the naked eye. This is a common misconception."
}
```

## Flashcard Sets

You can also create sets of flashcards:

```json
// Function: create_flashcard_set
{
  "title": "Solar System Quiz",
  "description": "Test your knowledge about our solar system",
  "cards": [
    {
      "type": "basic",
      "question": "What is the largest planet in our solar system?",
      "answer": "Jupiter"
    },
    {
      "type": "mcq",
      "question": "Which planet is known as the Red Planet?",
      "options": [
        { "id": "a", "text": "Venus" },
        { "id": "b", "text": "Mars" },
        { "id": "c", "text": "Jupiter" },
        { "id": "d", "text": "Saturn" }
      ],
      "correctOptionId": "b"
    },
    {
      "type": "truefalse",
      "question": "Pluto is classified as a dwarf planet.",
      "isTrue": true,
      "explanation": "Since 2006, Pluto has been classified as a dwarf planet by the International Astronomical Union."
    }
  ]
}
```

## Optional Fields

All flashcard types support these optional fields:

- `explanation`: Explanation of the answer (shown after answering)
- `imageUrl`: URL to an image to display with the flashcard

## Integration with AI

The system is designed to automatically integrate with the AI's responses. When the AI calls one of the flashcard functions, the system:

1. Processes the function call
2. Creates the appropriate flashcard
3. Renders it as part of the AI's response
4. Notifies the user that a flashcard has been created

The AI is instructed to ask users if they would like flashcards for topics that might benefit from them, providing an easy way to test and use this feature. 