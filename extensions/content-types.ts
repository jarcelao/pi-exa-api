/**
 * Content type mapping utilities
 */

import type { SearchContentType, FetchContentType } from "./types.ts";

/**
 * Map search content type string to Exa API contents option.
 */
export function mapSearchContentType(
  contentType?: SearchContentType,
): { text?: true; highlights?: true; summary?: true } | undefined {
  switch (contentType) {
    case "text":
      return { text: true };
    case "highlights":
      return { highlights: true };
    case "summary":
      return { summary: true };
    case "none":
      return undefined;
    default:
      return { highlights: true };
  }
}

/**
 * Map fetch content type string to Exa API contents option.
 */
export function mapFetchContentType(
  contentType?: FetchContentType,
): { text?: true; highlights?: true; summary?: true } | undefined {
  switch (contentType) {
    case "text":
      return { text: true };
    case "highlights":
      return { highlights: true };
    case "summary":
      return { summary: true };
    default:
      return { text: true };
  }
}
