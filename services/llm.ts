/**
 * Itinerary LLM (restart Expo after env changes):
 * - OpenRouter: EXPO_PUBLIC_OPENROUTER_API_KEY (preferred if set; bypasses direct Gemini).
 *   Optional: EXPO_PUBLIC_OPENROUTER_MODEL (default openai/gpt-4o-mini; see openrouter.ai/models).
 * - Direct Gemini: EXPO_PUBLIC_GEMINI_API_KEY, optional EXPO_PUBLIC_GEMINI_MODEL.
 * - OpenAI / Anthropic: EXPO_PUBLIC_LLM_PROVIDER + EXPO_PUBLIC_LLM_API_KEY.
 *
 * Plain OPENROUTER_API_KEY is wired through app.config.js → extra.openrouterApiKey (expo-constants).
 * Prefer EXPO_PUBLIC_OPENROUTER_API_KEY when possible.
 */
import Constants from 'expo-constants';
import type {
    ItineraryDay,
    ItineraryPreferences,
    LocationWithCoordinates,
} from '@/types/database';

// LLM provider configuration
type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseURL?: string;
}

async function invokeLLM(config: LLMConfig, prompt: string): Promise<string> {
  switch (config.provider) {
    case 'openrouter':
      return await callOpenRouter(config, prompt);
    case 'openai':
      return await callOpenAI(config, prompt);
    case 'anthropic':
      return await callAnthropic(config, prompt);
    case 'gemini':
      return await callGemini(config, prompt);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
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
    return await invokeLLM(config, prompt);
  } catch (primaryError) {
    const or = resolveOpenRouterCredentials();
    if (config.provider === 'gemini' && or.key) {
      try {
        console.warn('Direct Gemini failed; retrying via OpenRouter.');
        return await invokeLLM(
          {
            provider: 'openrouter',
            apiKey: or.key,
            model: or.model,
          },
          prompt
        );
      } catch (fallbackErr) {
        console.error('OpenRouter fallback failed:', fallbackErr);
      }
    }
    console.error('LLM API call failed:', primaryError);
    throw primaryError;
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

Return a single JSON object (no markdown fences, no commentary) with exactly this shape:

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
    jsonStr = jsonStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '');

    // If extra prose wrapped the object, take outermost { ... }
    try {
      JSON.parse(jsonStr);
    } catch {
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start >= 0 && end > start) {
        jsonStr = jsonStr.slice(start, end + 1);
      }
    }

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

/** Models known to work widely on generativelanguage.googleapis.com v1beta */
const GEMINI_DEFAULT_MODEL = 'gemini-1.5-flash';

/** Default model on OpenRouter — stable; override with EXPO_PUBLIC_OPENROUTER_MODEL */
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';

const OPENROUTER_MODEL_FALLBACKS = [
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'google/gemini-flash-1.5-8b',
  'meta-llama/llama-3.3-70b-instruct',
  'anthropic/claude-3.5-haiku',
];

function sanitizeOpenRouterModelId(raw: string): string {
  return raw
    .trim()
    .replace(/\.+$/g, '')
    .replace(/\s+/g, '');
}

type ExpoExtra = {
  openrouterApiKey?: string;
  openrouterModel?: string;
};

/** OPENROUTER_API_KEY from .env is injected at build time via app.config.js → extra */
function openRouterFromExpoExtra(): { key: string; model: string } {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  return {
    key: (extra?.openrouterApiKey || '').trim(),
    model: (extra?.openrouterModel || '').trim(),
  };
}

/** Resolve OpenRouter key/model: EXPO_PUBLIC_* first, then app.config extra, then OPENROUTER_API_KEY */
function resolveOpenRouterCredentials(): { key: string; model: string } {
  const fromExtra = openRouterFromExpoExtra();
  const key =
    (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '').trim() ||
    fromExtra.key ||
    (process.env.OPENROUTER_API_KEY || '').trim();
  const modelRaw =
    sanitizeOpenRouterModelId(
      (process.env.EXPO_PUBLIC_OPENROUTER_MODEL || '').trim() ||
        fromExtra.model ||
        OPENROUTER_DEFAULT_MODEL
    ) || OPENROUTER_DEFAULT_MODEL;
  return {
    key,
    model: modelRaw,
  };
}

/**
 * Experimental IDs (e.g. gemini-2.0-flash-exp) often 404 on v1beta; map to stable IDs.
 */
function normalizeGeminiModelId(raw: string | undefined): string {
  const m = (raw || '').trim();
  if (!m) return GEMINI_DEFAULT_MODEL;
  const lower = m.toLowerCase();
  if (lower.includes('flash-exp') || /-exp$/i.test(m) || /-experimental$/i.test(m)) {
    return 'gemini-2.0-flash';
  }
  if (lower.endsWith('-preview') || lower.includes('preview-')) {
    return GEMINI_DEFAULT_MODEL;
  }
  return m;
}

function getLLMConfig(): LLMConfig {
  const orCreds = resolveOpenRouterCredentials();
  const openrouterKey = orCreds.key;
  const geminiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
  const llmKey = (process.env.EXPO_PUBLIC_LLM_API_KEY || '').trim();
  const providerOverride = (process.env.EXPO_PUBLIC_LLM_PROVIDER || '').trim().toLowerCase();

  const openrouterModel = orCreds.model || OPENROUTER_DEFAULT_MODEL;

  const geminiRawModel =
    (process.env.EXPO_PUBLIC_GEMINI_MODEL || '').trim() ||
    (process.env.EXPO_PUBLIC_LLM_MODEL || '').trim() ||
    GEMINI_DEFAULT_MODEL;

  if (providerOverride === 'openrouter') {
    const key = openrouterKey || llmKey;
    return {
      provider: 'openrouter',
      apiKey: key,
      model: openrouterModel,
    };
  }

  if (providerOverride === 'openai') {
    return {
      provider: 'openai',
      apiKey: llmKey,
      model: (process.env.EXPO_PUBLIC_LLM_MODEL || '').trim() || 'gpt-4o',
    };
  }

  if (providerOverride === 'anthropic') {
    return {
      provider: 'anthropic',
      apiKey: llmKey,
      model:
        (process.env.EXPO_PUBLIC_LLM_MODEL || '').trim() ||
        'claude-3-5-sonnet-20241022',
    };
  }

  if (providerOverride === 'gemini') {
    const key = geminiKey || llmKey;
    return {
      provider: 'gemini',
      apiKey: key,
      model: normalizeGeminiModelId(geminiRawModel),
    };
  }

  // No explicit provider: prefer OpenRouter when configured (common when direct Gemini fails)
  if (openrouterKey) {
    return {
      provider: 'openrouter',
      apiKey: openrouterKey,
      model: openrouterModel,
    };
  }

  if (geminiKey) {
    return {
      provider: 'gemini',
      apiKey: geminiKey,
      model: normalizeGeminiModelId(geminiRawModel),
    };
  }

  const provider = (providerOverride || 'openai') as LLMProvider;
  return {
    provider,
    apiKey: llmKey,
    model:
      (process.env.EXPO_PUBLIC_LLM_MODEL || '').trim() ||
      (provider === 'openai'
        ? 'gpt-4o'
        : provider === 'anthropic'
          ? 'claude-3-5-sonnet-20241022'
          : provider === 'gemini'
            ? GEMINI_DEFAULT_MODEL
            : 'gpt-4o'),
  };
}

/**
 * OpenRouter — OpenAI-compatible chat completions API
 * @see https://openrouter.ai/docs
 */
async function callOpenRouter(config: LLMConfig, prompt: string): Promise<string> {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available in this environment');
  }

  if (!config.apiKey) {
    throw new Error(
      'OpenRouter API key missing. Set OPENROUTER_API_KEY or EXPO_PUBLIC_OPENROUTER_API_KEY in .env and restart Expo (see app.config.js extra).'
    );
  }

  const primary = sanitizeOpenRouterModelId(config.model || OPENROUTER_DEFAULT_MODEL);
  const modelCandidates = [...new Set([primary, ...OPENROUTER_MODEL_FALLBACKS])];

  const bodyBase = {
    messages: [
      {
        role: 'system',
        content:
          'You are an expert travel itinerary planner. Always respond with valid JSON only: a single object with "title" (string) and "days" (array). No markdown code fences.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 8192,
  };

  let lastError = '';

  for (const model of modelCandidates) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://travora.app',
        'X-Title': 'Travora',
      },
      body: JSON.stringify({
        model,
        ...bodyBase,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      const isNoEndpoint =
        response.status === 404 &&
        (err.includes('No endpoints found') || err.includes('"code":404'));
      if (isNoEndpoint) {
        lastError = err;
        continue;
      }
      throw new Error(`OpenRouter API error (${model}): ${response.status} - ${err}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    const content = data.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.length > 0) {
      return content;
    }

    lastError = data.error?.message || `Empty content from ${model}`;
  }

  throw new Error(
    `OpenRouter: no model worked. Set EXPO_PUBLIC_OPENROUTER_MODEL to an id from openrouter.ai/models. Last error: ${lastError}`
  );
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

const GEMINI_FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

function geminiModelsToTry(primary: string | undefined): string[] {
  const first = normalizeGeminiModelId(primary);
  const rest = GEMINI_FALLBACK_MODELS.filter((m) => m !== first);
  return [...new Set([first, ...rest])];
}

/**
 * Call Google Gemini API (Generative Language API v1beta).
 * Retries other models on 404 (wrong model id for this API version).
 */
async function callGemini(config: LLMConfig, prompt: string): Promise<string> {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not available in this environment');
  }

  const userText = `${prompt}

Output: a single JSON object with "title" (string) and "days" (array). No markdown, no code fences, no text before or after the JSON.`;

  const baseBody = {
    systemInstruction: {
      parts: [
        {
          text: 'You are an expert travel itinerary planner. You must respond with valid JSON only (application/json). The root object has "title" and "days" keys.',
        },
      ],
    },
    contents: [{ parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  const bodyNoMime = {
    systemInstruction: baseBody.systemInstruction,
    contents: baseBody.contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  let lastError = '';

  for (const modelId of geminiModelsToTry(config.model)) {
    const modelEnc = encodeURIComponent(modelId);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEnc}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 400 && errText.includes('responseMimeType')) {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyNoMime),
        });
      } else if (response.status === 404) {
        lastError = errText;
        continue;
      } else {
        throw new Error(`Gemini API error (${modelId}): ${response.status} - ${errText}`);
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 404) {
        lastError = errText;
        continue;
      }
      throw new Error(`Gemini API error (${modelId}): ${response.status} - ${errText}`);
    }

    const data = (await response.json()) as {
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
      error?: { message?: string };
    };

    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the request: ${data.promptFeedback.blockReason}`);
    }

    const candidate = data.candidates?.[0];
    if (!candidate) {
      lastError =
        data.error?.message ||
        `No candidates for ${modelId}.`;
      continue;
    }

    if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error(
        'Itinerary response was cut off. Try fewer days or set EXPO_PUBLIC_GEMINI_MODEL=gemini-1.5-pro.'
      );
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (typeof text === 'string' && text.length > 0) {
      return text;
    }

    lastError = `Empty text from ${modelId}`;
  }

  throw new Error(
    `Gemini: no working model. Last error: ${lastError || 'unknown'}. Set EXPO_PUBLIC_GEMINI_MODEL to gemini-1.5-flash and restart Expo.`
  );
}

/**
 * Check if LLM is properly configured
 */
export function isLLMConfigured(): boolean {
  const config = getLLMConfig();
  return !!config.apiKey;
}

/** Which provider will be used (after resolving Gemini key vs LLM_* vars) */
export function getResolvedLLMProvider(): LLMProvider | null {
  const config = getLLMConfig();
  return config.apiKey ? config.provider : null;
}
