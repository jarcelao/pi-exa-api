/**
 * Exa Code Context tool definition
 */

import type { Theme } from "@earendil-works/pi-coding-agent";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

import { formatCodeContextResult, parseCostDollars } from "../formatters.ts";
import type { CodeContextDetails, CodeContextResponse } from "../types.ts";
import {
  requireApiKey,
  truncateAndSave,
  renderToolCall,
  renderToolResult,
  formatCost,
  EXA_CONTEXT_API_URL,
} from "./shared.ts";

// Tool parameter schema
export const ExaCodeContextParams = Type.Object({
  query: Type.String({
    description: "Search query to find relevant code snippets and examples",
  }),
  tokensNum: Type.Optional(
    Type.Union([
      Type.String({
        description: 'Token limit: "dynamic" for automatic sizing',
      }),
      Type.Number({
        description: "Token limit: 50-100000 (5000 is a good default)",
      }),
    ]),
  ),
});

type CodeContextParams = Static<typeof ExaCodeContextParams>;

/**
 * Create the exa_code_context tool definition.
 */
export function createExaCodeContextTool() {
  return defineTool({
    name: "exa_code_context",
    label: "Exa Code Context",
    description:
      "Search for code snippets and examples from open source libraries and repositories. Use this to find working code examples that help understand how libraries, frameworks, or concepts are implemented.",
    parameters: ExaCodeContextParams,

    async execute(
      _toolCallId: string,
      params: CodeContextParams,
      _signal: AbortSignal | undefined,
      _onUpdate: unknown,
      _ctx: unknown,
    ) {
      const apiKey = requireApiKey();

      // Ensure tokensNum is the correct type: number or "dynamic"
      let tokensNum: string | number = params.tokensNum ?? "dynamic";
      if (typeof tokensNum === "string" && tokensNum !== "dynamic") {
        tokensNum = Number(tokensNum);
      }

      let response: CodeContextResponse;
      try {
        const httpResponse = await fetch(EXA_CONTEXT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            query: params.query,
            tokensNum,
          }),
        });

        if (!httpResponse.ok) {
          const errorText = await httpResponse.text();
          throw new Error(`HTTP ${httpResponse.status}: ${errorText}`);
        }

        response = (await httpResponse.json()) as CodeContextResponse;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Exa Context API error: ${message}`);
      }

      const output = formatCodeContextResult(response);
      const result = await truncateAndSave(output);
      const cost = parseCostDollars(response.costDollars);

      return {
        content: [{ type: "text", text: result }],
        details: {
          query: params.query,
          resultsCount: response.resultsCount,
          outputTokens: response.outputTokens,
          cost,
        } as CodeContextDetails,
      };
    },

    renderCall(args: CodeContextParams, theme: Theme) {
      const desc = `${args.tokensNum ?? "dynamic"} tokens`;
      return renderToolCall("exa_code_context", args.query, desc, theme);
    },

    renderResult(result, options, theme, context) {
      const details = result.details as CodeContextDetails | undefined;
      const cost = details ? formatCost(details.cost) : "";
      const header = details
        ? theme.fg(
            "success",
            `✓ ${details.resultsCount} sources • ${details.outputTokens} tokens${cost}`,
          )
        : "";
      return renderToolResult(header, result, options, theme, context);
    },
  });
}
