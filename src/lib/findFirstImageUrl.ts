import { z } from 'zod';
import debounce from 'lodash/debounce';

// Type definitions
export interface WikimediaSearchParams {
  searchQuery: string;
  limit?: number;
}

export interface WikimediaSearchResult {
  imageUrl: string | null;
  title?: string;
  caption?: string;
  error?: string;
  timestamp?: number; // Added for cache management
}

// Wikimedia API response types
interface WikimediaImageInfo {
  url: string;
  extmetadata?: {
    ImageDescription?: {
      value: string;
    };
  };
}

interface WikimediaPage {
  title: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

// Validation schema
const searchParamsSchema = z.object({
  searchQuery: z.string().min(1).max(100),
  limit: z.number().min(1).max(25).default(5)
});

// Simple in-memory cache
const cache = new Map<string, WikimediaSearchResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting setup
export const RATE_LIMIT_WINDOW = 1000; // 1 second
export const MAX_REQUESTS = 5;
let requestCount = 0;
let windowStart = Date.now();

// Export a function to reset the rate limiting state for testing
export const resetRateLimitState = () => {
  requestCount = 0;
  windowStart = Date.now();
  cache.clear(); // Clear cache when resetting state
};

// Reset rate limit counter
const resetRateLimit = () => {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
    return true;
  }
  return false;
};

// Check rate limit
const isRateLimited = (): boolean => {
  resetRateLimit();
  return requestCount >= MAX_REQUESTS;
};

// Increment request count
const incrementRequestCount = (): void => {
  requestCount++;
};

// Cache management
const getCachedResult = (query: string): WikimediaSearchResult | undefined => {
  const cached = cache.get(query);
  if (cached) {
    const now = Date.now();
    if (cached.timestamp && now - cached.timestamp > CACHE_TTL) {
      cache.delete(query);
      return undefined;
    }
    return cached;
  }
  return undefined;
};

// Core image search function
export async function findFirstImageUrl(
  params: WikimediaSearchParams
): Promise<WikimediaSearchResult> {
  try {
    // Validate input parameters
    const validatedParams = searchParamsSchema.parse(params);
    const { searchQuery, limit } = validatedParams;

    // Check cache first
    const cached = getCachedResult(searchQuery);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    if (isRateLimited()) {
      return {
        imageUrl: null,
        error: "Rate limit exceeded. Please try again in a few seconds."
      };
    }

    // Increment request count before making the request
    incrementRequestCount();

    // Construct API URL with proper encoding
    const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
    const searchParams = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: `${searchQuery} filetype:bitmap|drawing|image|video`, // Search for all image types
      gsrlimit: limit.toString(),
      gsrnamespace: "6", // File namespace
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      format: "json",
      origin: "*",
      redirects: "1" // Follow redirects
    });
    apiUrl.search = searchParams.toString();

    // Make request to Wikimedia API
    const response = await fetch(apiUrl.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "WisdomCore/1.0 (https://github.com/yourusername/wisdom-core; your@email.com)"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as WikimediaResponse;

    // Handle no results
    if (!data.query?.pages || Object.keys(data.query.pages).length === 0) {
      return {
        imageUrl: null,
        error: "No matching images found"
      };
    }

    // Find first valid image
    const pages = Object.values(data.query.pages);
    for (const page of pages) {
      const imageInfo = page.imageinfo?.[0];
      if (imageInfo?.url) {
        const result: WikimediaSearchResult = {
          imageUrl: imageInfo.url,
          title: page.title,
          caption: imageInfo.extmetadata?.ImageDescription?.value
        };

        // Cache the result with timestamp
        const cachedResult = {
          ...result,
          timestamp: Date.now()
        };
        cache.set(searchQuery, cachedResult);

        return result;
      }
    }

    return {
      imageUrl: null,
      error: "No matching images found"
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        imageUrl: null,
        error: "Invalid search parameters: " + error.errors[0].message
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      imageUrl: null,
      error: `Error searching for image: ${errorMessage}`
    };
  }
}

// Debounced version for rapid queries
export const findFirstImageUrlDebounced = debounce(findFirstImageUrl, 300);

// OpenAI tool definition
export const imageSearchTool = {
  type: "function" as const,
  name: "findFirstImageUrl",
  description: "Search Wikimedia Commons for an image matching the query and return its URL.",
  parameters: {
    type: "object",
    properties: {
      searchQuery: {
        type: "string",
        description: "Search term to find a relevant image. Supports all image types including photos, diagrams, drawings, etc.",
        examples: ["water cycle diagram", "solar system planets"]
      },
      limit: {
        type: "integer",
        description: "Max number of files to scan.",
        default: 5,
        minimum: 1,
        maximum: 25
      }
    },
    required: ["searchQuery"],
    additionalProperties: false
  }
} as const;