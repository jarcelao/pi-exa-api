import { describe, it, expect } from "vitest";
import exaSearchExtension from "../extensions/exa-search.ts";

describe("Extension Registration", () => {
  function createMockExtensionAPI() {
    const tools: unknown[] = [];
    const commands: Map<string, unknown> = new Map();
    const eventHandlers: Map<string, unknown[]> = new Map();

    const api = {
      registerTool: (tool: unknown) => tools.push(tool),
      registerCommand: (name: string, command: unknown) => commands.set(name, command),
      on: (event: string, handler: unknown) => {
        const handlers = eventHandlers.get(event) || [];
        handlers.push(handler);
        eventHandlers.set(event, handlers);
      },
      getTools: () => tools,
      getCommands: () => Array.from(commands.entries()),
      getEventHandlers: (event: string) => eventHandlers.get(event) || [],
    };

    return api;
  }

  it("should register exa_search tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    expect(tools.length).toBe(3);

    const exaSearchTool = tools.find((t: unknown) => (t as { name: string }).name === "exa_search");
    expect(exaSearchTool).toBeDefined();
    expect((exaSearchTool as { name: string }).name).toBe("exa_search");
    expect((exaSearchTool as { label: string }).label).toBe("Exa Search");
  });

  it("should register exa_fetch tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const exaFetchTool = tools.find((t: unknown) => (t as { name: string }).name === "exa_fetch");
    expect(exaFetchTool).toBeDefined();
    expect((exaFetchTool as { name: string }).name).toBe("exa_fetch");
    expect((exaFetchTool as { label: string }).label).toBe("Exa Fetch");
  });

  it("should register exa_code_context tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const codeContextTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_code_context",
    );
    expect(codeContextTool).toBeDefined();
    expect((codeContextTool as { name: string }).name).toBe("exa_code_context");
    expect((codeContextTool as { label: string }).label).toBe("Exa Code Context");
  });

  it("should have execute function on exa_code_context tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const codeContextTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_code_context",
    ) as { execute: unknown };
    expect(typeof codeContextTool?.execute).toBe("function");
  });

  it("should register /exa-status command", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const commands = api.getCommands();
    const exaStatusCmd = commands.find(([name]) => name === "exa-status");
    expect(exaStatusCmd).toBeDefined();
    expect(exaStatusCmd![0]).toBe("exa-status");
    expect((exaStatusCmd![1] as { description: string }).description).toContain("API key");
  });

  it("should register session_start event handler", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const handlers = api.getEventHandlers("session_start");
    expect(handlers.length).toBe(1);
  });

  it("should have execute function on exa_search tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const exaSearchTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_search",
    ) as { execute: unknown };
    expect(typeof exaSearchTool?.execute).toBe("function");
  });

  it("should have execute function on exa_fetch tool", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const exaFetchTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_fetch",
    ) as { execute: unknown };
    expect(typeof exaFetchTool?.execute).toBe("function");
  });

  it("should display cost in exa_fetch renderResult", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const exaFetchTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_fetch",
    ) as { renderResult: Function };

    const mockTheme = {
      fg: (name: string, text: string) => text,
    };

    const mockResult = {
      content: [{ type: "text", text: "test" }],
      details: {
        url: "https://example.com",
        title: "Test Page",
        cost: { total: 0.000123 },
      },
    };

    const rendered = exaFetchTool.renderResult(
      mockResult,
      { expanded: false, isPartial: false },
      mockTheme,
    );

    expect(rendered.text).toContain("Test Page");
    expect(rendered.text).toContain("$0.000123");
  });

  it("should display cost without title in exa_fetch renderResult", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const exaFetchTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_fetch",
    ) as { renderResult: Function };

    const mockTheme = {
      fg: (name: string, text: string) => text,
    };

    const mockResult = {
      content: [{ type: "text", text: "test" }],
      details: {
        url: "https://example.com",
        cost: { total: 0.000456 },
      },
    };

    const rendered = exaFetchTool.renderResult(
      mockResult,
      { expanded: false, isPartial: false },
      mockTheme,
    );

    expect(rendered.text).toContain("Fetched");
    expect(rendered.text).toContain("$0.000456");
  });

  it("should display stats and cost in exa_code_context renderResult", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const codeContextTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_code_context",
    ) as { renderResult: Function };

    const mockTheme = {
      fg: (name: string, text: string) => text,
    };

    const mockResult = {
      content: [{ type: "text", text: "test" }],
      details: {
        query: "React hooks",
        resultsCount: 502,
        outputTokens: 4805,
        cost: { total: 1.0 },
      },
    };

    const rendered = codeContextTool.renderResult(
      mockResult,
      { expanded: false, isPartial: false },
      mockTheme,
    );

    expect(rendered.text).toContain("502 sources");
    expect(rendered.text).toContain("4805 tokens");
    expect(rendered.text).toContain("$1.000000");
  });

  it("should display exa_code_context renderResult without cost", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const codeContextTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_code_context",
    ) as { renderResult: Function };

    const mockTheme = {
      fg: (name: string, text: string) => text,
    };

    const mockResult = {
      content: [{ type: "text", text: "test" }],
      details: {
        query: "Express middleware",
        resultsCount: 100,
        outputTokens: 2000,
      },
    };

    const rendered = codeContextTool.renderResult(
      mockResult,
      { expanded: false, isPartial: false },
      mockTheme,
    );

    expect(rendered.text).toContain("100 sources");
    expect(rendered.text).toContain("2000 tokens");
    expect(rendered.text).not.toContain("$");
  });

  it("should handle exa_code_context renderResult without details", () => {
    const api = createMockExtensionAPI();
    exaSearchExtension(api as unknown as import("@mariozechner/pi-coding-agent").ExtensionAPI);

    const tools = api.getTools();
    const codeContextTool = tools.find(
      (t: unknown) => (t as { name: string }).name === "exa_code_context",
    ) as { renderResult: Function };

    const mockTheme = {
      fg: (name: string, text: string) => text,
    };

    const mockResult = {
      content: [{ type: "text", text: "Some code context output here" }],
    };

    const rendered = codeContextTool.renderResult(
      mockResult,
      { expanded: false, isPartial: false },
      mockTheme,
    );

    expect(rendered.text).toContain("Some code context");
  });
});
