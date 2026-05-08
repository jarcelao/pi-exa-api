/**
 * Exa Search tool definition
 */

import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";
import Exa from "exa-js";

import { mapSearchContentType } from "../content-types.ts";
import { formatSearchResults } from "../formatters.ts";
import type { SearchContentType, SearchDetails, ExaSearchResult } from "../types.ts";
import {
  requireApiKey,
  truncateAndSave,
  renderToolCall,
  renderToolResult,
  formatCost,
} from "./shared.ts";

// Tool parameter schema
export const ExaSearchParams = Type.Object({
  query: Type.String({
    description: "Natural language search query",
  }),
  contentType: Type.Optional(
    Type.Union([
      Type.Literal("text"),
      Type.Literal("highlights"),
      Type.Literal("summary"),
      Type.Literal("none"),
    ]),
  ),
  numResults: Type.Optional(
    Type.Number({
      description: "Number of results (1-100)",
    }),
  ),
});

type SearchParams = Static<typeof ExaSearchParams>;

/**
 * Create the exa_search tool definition.
 */
export function createExaSearchTool() {
  return defineTool({
    name: "exa_search",
    label: "Exa Search",
    description:
      "Search the web using Exa's neural search API. Best for factual queries, research, and finding relevant web content. Use highlights mode by default for token efficiency.",
    parameters: ExaSearchParams,

    async execute(
      _toolCallId: string,
      params: SearchParams,
      _signal: AbortSignal | undefined,
      _onUpdate: unknown,
      _ctx: ExtensionContext,
    ) {
      const apiKey = requireApiKey();
      const numResults = Math.max(1, Math.min(100, params.numResults ?? 10));
      const exa = new Exa(apiKey);

      const contents = mapSearchContentType(params.contentType as SearchContentType | undefined);
      const searchOptions: {
        numResults: number;
        contents?: { text?: true; highlights?: true; summary?: true };
      } = { numResults };

      if (contents) {
        searchOptions.contents = contents;
      }

      let response;
      try {
        response = await exa.search(params.query, searchOptions);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Exa API error: ${message}`);
      }

      const output = formatSearchResults({
        results: response.results as ExaSearchResult[],
        costDollars: response.costDollars as { total: number } | undefined,
      });

      const result = await truncateAndSave(output);

      return {
        content: [{ type: "text", text: result }],
        details: {
          query: params.query,
          numResults: response.results.length,
          cost: response.costDollars,
        } as SearchDetails,
      };
    },

    renderCall(args: SearchParams, theme: Theme) {
      const desc = `${args.numResults ?? 10} results • ${args.contentType ?? "highlights"}`;
      return renderToolCall("exa_search", args.query, desc, theme);
    },

    renderResult(result, options, theme, context) {
      const details = result.details as SearchDetails | undefined;
      const cost = details ? formatCost(details.cost) : "";
      const header = details ? theme.fg("success", `✓ ${details.numResults} results${cost}`) : "";
      return renderToolResult(header, result, options, theme, context);
    },
  });
}
