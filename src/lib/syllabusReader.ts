/**
 * In-memory storage for syllabus content.
 * In a real application, this data would likely come from an API or static assets.
 */
const syllabusContentMap: { [key: string]: string } = {
  "Chemistry": "Chemistry Syllabus: Atomic structure, chemical bonding, states of matter.",
  "Physics": "Physics Syllabus: Mechanics, thermodynamics, electricity and magnetism.",
  "Biology": "Biology Syllabus: Cell biology, genetics, ecology.",
  "Mathematics": "Mathematics Syllabus: Algebra, calculus, statistics.",
  "English": "English Syllabus: Literature analysis, grammar, essay writing.",
  "Computer Science": "Computer Science Syllabus: Programming fundamentals, data structures, algorithms."
};

/**
 * Retrieves the syllabus content for a specific academic subject from in-memory storage.
 *
 * @param subject The academic subject (e.g., "Physics", "Computer Science").
 * @returns The syllabus content as a string, or an error message if the subject is not found.
 */
export function get_syllabus(subject: string): string {
  console.log(`Attempting to retrieve syllabus for: ${subject}`);

  // Normalize subject name for lookup (optional, but good practice if input might vary)
  const normalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();

  if (syllabusContentMap[normalizedSubject]) {
    console.log(`Successfully retrieved syllabus for ${subject}.`);
    return syllabusContentMap[normalizedSubject];
  } else {
    console.warn(`Syllabus not found for subject: ${subject}`);
    return `Error: Syllabus content not available for subject "${subject}".`;
  }
}

// Example usage (optional, for testing purposes)
/*
function testSyllabusReader() {
  const subject = "Physics"; // Change to test different subjects
  const syllabusContent = get_syllabus(subject);
  console.log(`Syllabus for ${subject}:\n`, syllabusContent);

  const invalidSubject = "Astrophysics";
  const invalidSyllabusContent = get_syllabus(invalidSubject);
  console.log(`Syllabus for ${invalidSubject}:\n`, invalidSyllabusContent);
}

testSyllabusReader();
*/