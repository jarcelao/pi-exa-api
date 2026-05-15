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

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { resolveAuth } from "./auth.ts";

import { createExaSearchTool } from "./tools/search.ts";
import { createExaFetchTool } from "./tools/fetch.ts";
import { createExaCodeContextTool } from "./tools/code-context.ts";

export default function exaSearchExtension(pi: ExtensionAPI): void {
  pi.on("session_start", async (_event: unknown, ctx: ExtensionContext) => {
    const auth = await resolveAuth();
    for (const warning of auth.warnings) {
      ctx.ui.notify(warning, "warning");
    }
    if (!auth.configured) {
      ctx.ui.notify(
        "Exa API key not configured. Set the EXA_API_KEY environment variable or create an exa-auth.json file in ~/.pi/agent/.",
        "warning",
      );
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
      const auth = await resolveAuth();
      for (const warning of auth.warnings) {
        ctx.ui.notify(warning, "warning");
      }
      let message: string;
      switch (auth.source) {
        case "file":
          message = "Exa API key: configured ✓ (source: file — exa-auth.json)";
          break;
        case "env":
          message = "Exa API key: configured ✓ (source: env — EXA_API_KEY)";
          break;
        case "none":
        default:
          message =
            "Exa API key: not configured ✗\n" +
            "Set the EXA_API_KEY environment variable or create an exa-auth.json file in ~/.pi/agent/.";
          break;
      }
      ctx.ui.notify(message, auth.configured && auth.warnings.length === 0 ? "info" : "warning");
    },
  });
}
