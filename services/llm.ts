import type {
  LocationWithCoordinates,
  ItineraryPreferences,
  ItineraryDay,
} from '@/types/database';

// LLM provider configuration
type LLMProvider = 'openai' | 'anthropic';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

/**
 * Call LLM API to generate itinerary content
 */
export async function callLLM(prompt: string): Promise<string> {
  const config = getLLMConfig();

  if (!config.apiKey) {
    throw new Error('LLM API key not configured');
  }

  try {
    switch (config.provider) {
      case 'openai':
        return await callOpenAI(config, prompt);
      case 'anthropic':
        return await callAnthropic(config, prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  } catch (error) {
    console.error('LLM API call failed:', error);
    throw error;
  }
}

/**
 * Build the prompt for itinerary generation
 */
export function buildItineraryPrompt(
  locations: LocationWithCoordinates[],
  preferences: ItineraryPreferences
): string {
  const locationsText = locations
    .map(
      (loc) => `
- ${loc.title || 'Unnamed Location'}
  Location: ${loc.location || 'Unknown'}
  Description: ${loc.caption || loc.description || 'No description available'}
  Coordinates: ${loc.latitude?.toFixed(4) || 'N/A'}, ${
        loc.longitude?.toFixed(4) || 'N/A'
      }
`
    )
    .join('\n');

  return `You are an expert travel itinerary planner. Create a personalized, day-by-day travel itinerary based on the user's preferences and liked destinations.

## User Preferences
- Destination: ${preferences.destination}
- Duration: ${preferences.durationDays} days
- Travel Style: ${preferences.travelStyle || 'mixed'}
- Budget Level: ${preferences.budgetLevel || 'moderate'}
- Special Interests: ${preferences.interests?.join(', ') || 'None specified'}

## Liked Destinations
The user has shown interest in these places:

${locationsText}

## Instructions

Create a ${preferences.durationDays}-day itinerary that:

1. **Prioritizes liked locations** - Use the destinations they've liked as the foundation
2. **Groups by proximity** - Minimize travel time by clustering nearby activities
3. **Realistic timing** - Allocate appropriate time for each activity (museums: 2-3h, quick visits: 1h, etc.)
4. **Logical flow** - Avoid back-and-forth travel across the city
5. **Travel style** - ${
    preferences.travelStyle === 'adventure'
      ? 'Include outdoor activities and exciting experiences'
      : preferences.travelStyle === 'relaxation'
      ? 'Include leisurely paced activities with breaks'
      : preferences.travelStyle === 'cultural'
      ? 'Focus on museums, historical sites, and cultural experiences'
      : preferences.travelStyle === 'foodie'
      ? 'Include local food experiences and restaurant recommendations'
      : 'Balance activities across different categories'
  }
6. **Budget appropriate** - ${
    preferences.budgetLevel === 'budget'
      ? 'Suggest free and low-cost activities'
      : preferences.budgetLevel === 'luxury'
      ? 'Include premium experiences and fine dining'
      : 'Mix of affordable and mid-range options'
   }

## Response Format

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanations outside the JSON).

\`\`\`json
{
  "title": "Catchy trip title",
  "days": [
    {
      "day": 1,
      "morning": {
        "time": "9:00 AM",
        "activity": "Activity name",
        "location": "Location name",
        "description": "Brief description of what to do and see",
        "duration": "2-3 hours"
      },
      "afternoon": {
        "time": "1:00 PM",
        "activity": "Activity name",
        "location": "Location name",
        "description": "Brief description",
        "duration": "2 hours"
      },
      "evening": {
        "time": "6:00 PM",
        "activity": "Activity name",
        "location": "Location name",
        "description": "Brief description",
        "duration": "2 hours"
      }
    }
  ]
}
\`\`\`

Additional days should follow the same structure. If a time period has no activity, omit that field.

Generate the complete itinerary now:`;
}

/**
 * Parse LLM response into structured itinerary
 */
export function parseItineraryResponse(
  response: string
): { title: string; days: ItineraryDay[] } {
  try {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Parse JSON
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.title || !Array.isArray(parsed.days)) {
      throw new Error('Invalid response structure');
    }

    return {
      title: parsed.title,
      days: parsed.days,
    };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    throw new Error('Failed to parse itinerary response. Please try again.');
  }
}

/**
 * Generate itinerary using LLM with timeout and fallback
 */
export async function generateItineraryWithLLM(
  locations: LocationWithCoordinates[],
  preferences: ItineraryPreferences,
  timeoutMs: number = 10000
): Promise<{ title: string; days: ItineraryDay[]; generationTime: number }> {
  const startTime = Date.now();

  // Validate inputs
  if (locations.length < 3) {
    throw new Error(
      'Please like at least 3 destinations to generate an itinerary.'
    );
  }

  // Build prompt
  const prompt = buildItineraryPrompt(locations, preferences);

  // Call LLM with timeout
  const response = await withTimeout(
    callLLM(prompt),
    timeoutMs,
    'LLM request timed out'
  );

  // Parse response
  const itinerary = parseItineraryResponse(response);

  const generationTime = Date.now() - startTime;

  return {
    ...itinerary,
    generationTime,
  };
}

/**
 * Wrapper to add timeout to async operations
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Get LLM configuration from environment variables
 */
function getLLMConfig(): LLMConfig {
  const provider = (process.env.EXPO_PUBLIC_LLM_PROVIDER ||
    'openai') as LLMProvider;
  const apiKey = process.env.EXPO_PUBLIC_LLM_API_KEY || '';

  return {
    provider,
    apiKey,
    model:
      process.env.EXPO_PUBLIC_LLM_MODEL ||
      (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(config: LLMConfig, prompt: string): Promise<string> {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available in this environment');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert travel itinerary planner. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  config: LLMConfig,
  prompt: string
): Promise<string> {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available in this environment');
  }

  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${prompt}

IMPORTANT: Respond with valid JSON only. Do not include markdown formatting, code blocks, or any text outside the JSON object.`,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Check if LLM is properly configured
 */
export function isLLMConfigured(): boolean {
  const config = getLLMConfig();
  return !!config.apiKey;
}
