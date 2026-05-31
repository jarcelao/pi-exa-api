/**
 * Result formatting utilities
 */

import { keyHint } from "@earendil-works/pi-coding-agent";
import type { Theme } from "@earendil-works/pi-coding-agent";

import type { ExaSearchResult, ExaSearchResponse, FetchContentType } from "./types.ts";

/**
 * Format search results into a readable string.
 */
export function formatSearchResults(response: ExaSearchResponse): string {
  const { results, costDollars } = response;
  const lines: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    lines.push(`--- Result ${i + 1} ---`);
    lines.push(`Title: ${result.title}`);
    lines.push(`URL: ${result.url}`);

    if (result.publishedDate) {
      lines.push(`Published: ${result.publishedDate}`);
    }
    if (result.author) {
      lines.push(`Author: ${result.author}`);
    }

    if (result.highlights && result.highlights.length > 0) {
      lines.push("Highlights:");
      for (const highlight of result.highlights) {
        lines.push(`  • ${highlight}`);
      }
    }

    if (result.text) {
      const preview = result.text.slice(0, 500);
      lines.push(`Text: ${preview}${result.text.length > 500 ? "..." : ""}`);
    }

    if (result.summary) {
      lines.push(`Summary: ${result.summary}`);
    }

    lines.push("");
  }

  if (costDollars) {
    lines.push(`Cost: $${costDollars.total.toFixed(6)}`);
  }

  return lines.join("\n");
}

/**
 * Format a fetch result into a readable string.
 */
export function formatFetchResult(result: ExaSearchResult, contentType: FetchContentType): string {
  const lines: string[] = [];

  if (result.title) {
    lines.push(`Title: ${result.title}`);
  }
  lines.push(`URL: ${result.url}`);
  lines.push("");

  switch (contentType) {
    case "text":
      if (result.text) {
        lines.push(result.text);
      }
      break;
    case "highlights":
      if (result.highlights && result.highlights.length > 0) {
        lines.push("Highlights:");
        for (const h of result.highlights) {
          lines.push(`  • ${h}`);
        }
      }
      break;
    case "summary":
      if (result.summary) {
        lines.push("Summary:");
        lines.push(result.summary);
      }
      break;
  }

  return lines.join("\n");
}

/**
 * Format a preview of tool output for TUI display.
 * Shows up to 10 lines when collapsed, full output when expanded.
 */
export function formatToolOutputPreview(
  result: { content: Array<{ type: string; text?: string }> },
  options: { expanded: boolean },
  theme: Theme,
): string {
  const textBlocks = result.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text || "");

  if (textBlocks.length === 0) {
    return "";
  }

  const output = textBlocks.join("\n");
  const lines = output.split("\n");

  // Trim trailing empty lines
  let end = lines.length;
  while (end > 0 && lines[end - 1] === "") {
    end--;
  }
  const trimmedLines = lines.slice(0, end);

  const maxLines = options.expanded ? trimmedLines.length : 10;
  const displayLines = trimmedLines.slice(0, maxLines);
  const remaining = trimmedLines.length - maxLines;

  let text = displayLines.map((line) => theme.fg("toolOutput", line)).join("\n");

  if (remaining > 0) {
    text += `\n${theme.fg("muted", `... (${remaining} more lines, ${keyHint("app.tools.expand", "to expand")})`)}`;
  }

  return text;
}
