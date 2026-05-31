/**
 * Type definitions for Exa API extension
 */

// Content type options
export type SearchContentType = "text" | "highlights" | "summary" | "none";
export type FetchContentType = "text" | "highlights" | "summary";

// Search result types
export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string | null;
  author?: string | null;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  costDollars?: { total: number };
}

// Tool detail types
export interface SearchDetails {
  query: string;
  numResults: number;
  cost?: { total: number };
}

export interface FetchDetails {
  url: string;
  title?: string;
  cost?: { total: number };
}

// Exa search options type
export interface SearchOptions {
  numResults: number;
  contents?: { text?: true; highlights?: true; summary?: true };
}

// Exa getContents options type
export interface GetContentsOptions {
  text?: true;
  highlights?: true;
  summary?: true;
  maxCharacters?: number;
}
