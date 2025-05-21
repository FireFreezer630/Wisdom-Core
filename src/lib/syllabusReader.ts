/**
 * Cache object to store syllabus content in memory
 */
const syllabusCache: { [subject: string]: { content: string; timestamp: number } } = {};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Retrieves the syllabus content for a specific academic subject using the fetch API.
 * Implements caching to improve performance for frequently accessed syllabi.
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
  // Construct the URL relative to the public directory
  const fileUrl = `/syllabi/${fileName}`;

  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      // Handle HTTP errors (e.g., 404 Not Found)
      const errorText = `Error fetching syllabus for subject "${subject}": ${response.status} ${response.statusText}`;
      console.error(errorText);
      return `Error: Syllabus file not found for subject "${subject}".`;
    }

    const syllabusContent = await response.text();
    
    // Store in cache with timestamp
    syllabusCache[subject] = {
      content: syllabusContent,
      timestamp: now
    };

    console.log(`Successfully retrieved and cached syllabus from: ${fileUrl}`);
    return syllabusContent;
  } catch (error: any) {
    // Handle network errors
    console.error(`Network error fetching syllabus for subject "${subject}": ${error.message}`);
    return `Error: Could not fetch syllabus for subject "${subject}".`;
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