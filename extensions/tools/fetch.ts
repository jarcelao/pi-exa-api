/**
 * Exa Fetch tool definition
 */

import type { ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type, type Static } from "typebox";
import Exa from "exa-js";

import { mapFetchContentType } from "../content-types.ts";
import { formatFetchResult } from "../formatters.ts";
import type { FetchContentType, FetchDetails, ExaSearchResult } from "../types.ts";
import {
  requireApiKey,
  truncateAndSave,
  renderToolCall,
  renderToolResult,
  formatCost,
} from "./shared.ts";

// Tool parameter schema
export const ExaFetchParams = Type.Object({
  url: Type.String({
    description: "URL to fetch content from",
  }),
  contentType: Type.Optional(
    Type.Union([Type.Literal("text"), Type.Literal("highlights"), Type.Literal("summary")]),
  ),
  maxCharacters: Type.Optional(
    Type.Number({
      description: "Maximum characters to return",
    }),
  ),
});

type FetchParams = Static<typeof ExaFetchParams>;

/**
 * Create the exa_fetch tool definition.
 */
export function createExaFetchTool() {
  return defineTool({
    name: "exa_fetch",
    label: "Exa Fetch",
    description:
      "Fetch and extract content from a specific URL using Exa. Can return full text, highlights, or AI-generated summary.",
    parameters: ExaFetchParams,

    async execute(
      _toolCallId: string,
      params: FetchParams,
      _signal: AbortSignal | undefined,
      _onUpdate: unknown,
      _ctx: ExtensionContext,
    ) {
      const apiKey = requireApiKey();
      const exa = new Exa(apiKey);

      const contentsOptions: {
        text?: true;
        highlights?: true;
        summary?: true;
        maxCharacters?: number;
      } = {};

      const mappedContent = mapFetchContentType(params.contentType as FetchContentType | undefined);
      if (mappedContent?.text) contentsOptions.text = true;
      if (mappedContent?.highlights) contentsOptions.highlights = true;
      if (mappedContent?.summary) contentsOptions.summary = true;
      if (params.maxCharacters) {
        contentsOptions.maxCharacters = Math.max(1000, Math.min(100000, params.maxCharacters));
      }

      let response;
      try {
        response = await exa.getContents(params.url, contentsOptions);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Exa API error: ${message}`);
      }

      if (!response.results || response.results.length === 0) {
        return {
          content: [{ type: "text", text: "No content found at this URL." }],
          details: { url: params.url, cost: response.costDollars } as FetchDetails,
        };
      }

      const result = response.results[0] as ExaSearchResult;
      const output = formatFetchResult(result, (params.contentType ?? "text") as FetchContentType);
      const content = await truncateAndSave(output);

      return {
        content: [{ type: "text", text: content }],
        details: {
          url: params.url,
          title: result.title,
          cost: response.costDollars,
        } as FetchDetails,
      };
    },

    renderCall(args: FetchParams, theme: Theme) {
      const desc = args.contentType ?? "text";
      return renderToolCall("exa_fetch", args.url, desc, theme);
    },

    renderResult(result, options, theme, context) {
      const details = result.details as FetchDetails | undefined;
      const cost = details ? formatCost(details.cost) : "";
      const header = details
        ? details.title
          ? theme.fg("success", `✓ ${details.title}${cost}`)
          : theme.fg("success", `✓ Fetched${cost}`)
        : "";
      return renderToolResult(header, result, options, theme, context);
    },
  });
}
