/**
 * Error creation utilities
 */

/**
 * Create an error for missing API key configuration.
 */
export function createMissingApiKeyError(): Error {
  return new Error(
    "Exa API key not configured. Set EXA_API_KEY environment variable before starting pi.",
  );
}
