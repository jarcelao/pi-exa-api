/**
 * API Key Management
 */

/**
 * Get the Exa API key from environment variables.
 * @returns The API key if set and non-empty, undefined otherwise.
 */
export function getApiKey(): string | undefined {
  const key = process.env.EXA_API_KEY;
  return key && key.length > 0 ? key : undefined;
}
