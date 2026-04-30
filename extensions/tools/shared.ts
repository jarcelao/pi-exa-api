/**
 * Shared utilities for Exa tools
 */

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";

import { getApiKey } from "../api-key.ts";
import { createMissingApiKeyError } from "../errors.ts";
import { formatToolOutputPreview } from "../formatters.ts";

/** Exa Context API base URL */
export const EXA_CONTEXT_API_URL = "https://api.exa.ai/context";

/**
 * Require an API key to be configured, throwing if missing.
 * @returns The API key
 */
export function requireApiKey(): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw createMissingApiKeyError();
  }
  return apiKey;
}

/**
 * Truncate output and save to temp file if needed.
 * @param output - The full output string
 * @returns Object with the (possibly truncated) content string
 */
export async function truncateAndSave(output: string): Promise<string> {
  const truncation = truncateHead(output, {
    maxLines: DEFAULT_MAX_LINES,
    maxBytes: DEFAULT_MAX_BYTES,
  });

  let content = truncation.content;

  if (truncation.truncated) {
    const tempDir = await mkdtemp(join(tmpdir(), "pi-exa-"));
    const tempFile = join(tempDir, "output.txt");
    await writeFile(tempFile, output, "utf8");
    content += `\n\n[Output truncated: ${truncation.outputLines} of ${truncation.totalLines} lines`;
    content += ` (${formatSize(truncation.outputBytes)} of ${formatSize(truncation.totalBytes)}).`;
    content += ` Full output saved to: ${tempFile}]`;
  }

  return content;
}

/**
 * Format the tool call preview for TUI display.
 * @param label - The tool label (e.g., "exa_search")
 * @param preview - The main preview text
 * @param desc - The description text
 * @param theme - The theme object
 */
export function renderToolCall(label: string, preview: string, desc: string, theme: Theme): Text {
  const truncatedPreview = preview.length > 50 ? preview.slice(0, 50) + "..." : preview;
  const text =
    theme.fg("toolTitle", theme.bold(`${label} `)) +
    theme.fg("muted", truncatedPreview) +
    theme.fg("dim", ` ${desc}`);
  return new Text(text, 0, 0);
}

/**
 * Format the tool result for TUI display with optional header and preview.
 * @param details - The details object with optional cost info
 * @param headerText - The header text to display
 * @param result - The full result object
 * @param options - The display options
 * @param theme - The theme object
 * @param context - The context object
 */
export function renderToolResult(
  headerText: string,
  result: { content: Array<{ type: string; text?: string }> },
  options: { expanded: boolean },
  theme: Theme,
  context: { lastComponent?: unknown },
): Text {
  const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
  const preview = formatToolOutputPreview(result, options, theme);
  text.setText(preview ? `${headerText}\n${preview}` : headerText);
  return text;
}

/**
 * Format cost for display.
 * @param cost - Cost object with total property
 * @returns Formatted cost string or empty string
 */
export function formatCost(cost?: { total: number }): string {
  return cost ? ` • $${cost.total.toFixed(6)}` : "";
}
