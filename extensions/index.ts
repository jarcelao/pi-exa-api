/**
 * exa-search Extension
 *
 * Registers three tools for web search, content fetching, and code context using the Exa API:
 * - exa_search: Natural language web search
 * - exa_fetch: Fetch and extract content from URLs
 * - exa_code_context: Search for code snippets and examples from open source repos
 *
 * Also registers the /exa-status command to check API key configuration.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

import { getApiKey } from "./api-key.ts";
import { createMissingApiKeyError } from "./errors.ts";
import { mapSearchContentType, mapFetchContentType } from "./content-types.ts";
import {
  formatSearchResults,
  formatFetchResult,
  formatCodeContextResult,
  parseCostDollars,
} from "./formatters.ts";

import { createExaSearchTool } from "./tools/search.ts";
import { createExaFetchTool } from "./tools/fetch.ts";
import { createExaCodeContextTool } from "./tools/code-context.ts";

// Re-export all utilities for testing
export {
  getApiKey,
  createMissingApiKeyError,
  mapSearchContentType,
  mapFetchContentType,
  formatSearchResults,
  formatFetchResult,
  formatCodeContextResult,
  parseCostDollars,
};

export default function exaSearchExtension(pi: ExtensionAPI): void {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    const hasKey = !!getApiKey();
    if (!hasKey) {
      ctx.ui.notify("Exa API key not configured. Set EXA_API_KEY to enable search.", "warning");
    }
  });

  // Register tools
  pi.registerTool(createExaSearchTool());
  pi.registerTool(createExaFetchTool());
  pi.registerTool(createExaCodeContextTool());

  // Register /exa-status command
  pi.registerCommand("exa-status", {
    description: "Check Exa API key configuration status",
    handler: async (_args: string, ctx: ExtensionContext) => {
      const configured = !!getApiKey();
      ctx.ui.notify(
        configured
          ? "Exa API key: configured via EXA_API_KEY"
          : "Exa API key: not configured. Set EXA_API_KEY environment variable.",
        configured ? "info" : "warning",
      );
    },
  });
}
