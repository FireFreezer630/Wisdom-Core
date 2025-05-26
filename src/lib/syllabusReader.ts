/**
 * Cache object to store syllabus content in memory
 */
const syllabusCache: { [subject: string]: { content: string; timestamp: number } } = {};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Import all syllabus files at build time
const syllabusImports: Record<string, string> = import.meta.glob('../syllabi/*.txt', { eager: true, as: 'string' }) as Record<string, string>;

/**
 * Retrieves the syllabus content for a specific academic subject.
 * Uses dynamic imports in production and fetch in development.
 *
 * @param subject The academic subject (e.g., "Physics", "Computer Science").
 * @returns A Promise that resolves with the syllabus content as a string, or rejects with an error.
 */
export async function get_syllabus(subject: string): Promise<string> {
  console.log(`Attempting to retrieve syllabus for: ${subject}`);

  // Check cache first
  const cached = syllabusCache[subject];
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Returning cached syllabus for: ${subject}`);
    return cached.content;
  }

  // Normalize subject name to match file naming convention (lowercase, spaces to underscores)
  const fileName = `${subject.toLowerCase().replace(/\s+/g, '_')}_syllabus.txt`;

  try {
    let syllabusContent: string;

    // Different loading strategy based on environment
    if (import.meta.env.PROD) {
      // In production, use the bundled files
      const filePath = `/src/syllabi/${fileName}`;
      const modulePath = `../syllabi/${fileName}`;
      
      // Try both possible paths
      let importedContent = syllabusImports[filePath] || syllabusImports[modulePath];
      
      if (!importedContent) {
        console.error('Available paths:', Object.keys(syllabusImports));
        throw new Error(`Syllabus file not found: ${fileName}`);
      }
      
      syllabusContent = importedContent;
    } else {
      // In development, use fetch
      const response = await fetch(`/syllabi/${fileName}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching syllabus: ${response.status} ${response.statusText}`);
      }
      
      syllabusContent = await response.text();
    }

    // Store in cache with timestamp
    syllabusCache[subject] = {
      content: syllabusContent,
      timestamp: now
    };

    console.log(`Successfully retrieved and cached syllabus for: ${subject}`);
    return syllabusContent;

  } catch (error: any) {
    console.error(`Error retrieving syllabus for "${subject}":`, error.message);
    return `Error: Could not load syllabus for subject "${subject}". ${error.message}`;
  }
}

// Example usage (optional, for testing purposes)
/*
async function testSyllabusReader() {
  const subject = "Computer Science"; // Change to test different subjects
  try {
    const syllabusContent = await get_syllabus(subject);
    console.log(`Syllabus for ${subject}:\n`, syllabusContent);
  } catch (error) {
    console.error(`Failed to get syllabus for ${subject}:`, error);
  }


  const invalidSubject = "Astrophysics";
  try {
    const invalidSyllabusContent = await get_syllabus(invalidSubject);
    console.log(`Syllabus for ${invalidSubject}:\n`, invalidSyllabusContent);
  } catch (error) {
    console.error(`Failed to get syllabus for ${invalidSubject}:`, error);
  }
}

testSyllabusReader();
*/
