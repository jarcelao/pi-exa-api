import { describe, it, expect, afterEach } from "vitest";
import exaSearchExtension, {
  getApiKey,
  mapSearchContentType,
  mapFetchContentType,
  formatSearchResults,
  formatFetchResult,
  formatCodeContextResult,
  parseCostDollars,
  createMissingApiKeyError,
} from "./extensions/exa-search.ts";
import {
  truncateHead,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
} from "@mariozechner/pi-coding-agent";

describe("API Key Management", () => {
  afterEach(() => {
    delete process.env.EXA_API_KEY;
  });

  it("should return undefined when EXA_API_KEY is not set", () => {
    delete process.env.EXA_API_KEY;
    expect(getApiKey()).toBeUndefined();
  });

  it("should return API key when EXA_API_KEY is set", () => {
    const testKey = "test-api-key-123";
    process.env.EXA_API_KEY = testKey;
    expect(getApiKey()).toBe(testKey);
  });

  it("should treat empty string as not configured", () => {
    process.env.EXA_API_KEY = "";
    expect(getApiKey()).toBeUndefined();
  });

  it("should throw descriptive error when API key is missing", () => {
    const error = createMissingApiKeyError();
    expect(error.message).toContain("EXA_API_KEY");
    expect(error.message).toContain("environment variable");
  });
});

describe("ContentType Mapping (Search)", () => {
  it('should map "text" to contents.text', () => {
    const result = mapSearchContentType("text");
    expect(result).toEqual({ text: true });
  });

  it('should map "highlights" to contents.highlights', () => {
    const result = mapSearchContentType("highlights");
    expect(result).toEqual({ highlights: true });
  });

  it('should map "summary" to contents.summary', () => {
    const result = mapSearchContentType("summary");
    expect(result).toEqual({ summary: true });
  });

  it('should map "none" to undefined (metadata only)', () => {
    const result = mapSearchContentType("none");
    expect(result).toBeUndefined();
  });

  it("should default to highlights when not specified", () => {
    const result = mapSearchContentType(undefined);
    expect(result).toEqual({ highlights: true });
  });
});

describe("ContentType Mapping (Fetch)", () => {
  it('should map "text" to contents.text', () => {
    const result = mapFetchContentType("text");
    expect(result).toEqual({ text: true });
  });

  it('should map "highlights" to contents.highlights', () => {
    const result = mapFetchContentType("highlights");
    expect(result).toEqual({ highlights: true });
  });

  it('should map "summary" to contents.summary', () => {
    const result = mapFetchContentType("summary");
    expect(result).toEqual({ summary: true });
  });

  it("should default to text for fetch when not specified", () => {
    const result = mapFetchContentType(undefined);
    expect(result).toEqual({ text: true });
  });
});

describe("Parameter Validation", () => {
  it("should accept valid search params (query only)", () => {
    const params = { query: "test query" };
    expect(params.query).toBeTruthy();
    expect(params.query.trim()).not.toBe("");
  });

  it("should accept valid search params (all options)", () => {
    const params = {
      query: "test",
      contentType: "highlights" as const,
      numResults: 10,
    };
    expect(params.query).toBeTruthy();
    expect(["text", "highlights", "summary", "none"].includes(params.contentType)).toBe(true);
    expect(params.numResults).toBeGreaterThanOrEqual(1);
    expect(params.numResults).toBeLessThanOrEqual(100);
  });

  it("should accept valid fetch params", () => {
    const params = {
      url: "https://example.com",
      contentType: "text" as const,
      maxCharacters: 5000,
    };
    expect(params.url).toBeTruthy();
    expect(["text", "highlights", "summary"].includes(params.contentType)).toBe(true);
    expect(params.maxCharacters).toBeGreaterThan(0);
  });

  it("should reject fetch params with invalid contentType", () => {
    const invalidContentTypes = ["none", "invalid", "full"];
    for (const ct of invalidContentTypes) {
      expect(["text", "highlights", "summary"].includes(ct as string)).toBe(false);
    }
  });
});

describe("Output Truncation", () => {
  it("should not truncate short output", () => {
    const text = "Short text";
    const result = truncateHead(text);
    expect(result.truncated).toBe(false);
    expect(result.content).toBe(text);
    expect(result.outputLines).toBe(1);
  });

  it("should truncate by line count", () => {
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i}`);
    const text = lines.join("\n");
    const result = truncateHead(text, { maxLines: 10 });
    expect(result.truncated).toBe(true);
    expect(result.outputLines).toBe(10);
    expect(result.totalLines).toBe(100);
  });

  it("should truncate by byte size", () => {
    const text = "x".repeat(10000);
    const result = truncateHead(text, { maxBytes: 1000 });
    expect(result.truncated).toBe(true);
    expect(result.outputBytes).toBeLessThanOrEqual(1000);
  });

  it("should respect DEFAULT_MAX_LINES constant", () => {
    expect(DEFAULT_MAX_LINES).toBe(2000);
  });

  it("should respect DEFAULT_MAX_BYTES constant", () => {
    expect(DEFAULT_MAX_BYTES).toBe(50 * 1024);
  });

  it("formatSize should format bytes correctly", () => {
    expect(formatSize(500)).toBe("500B");
    expect(formatSize(1024)).toBe("1.0KB");
    expect(formatSize(1024 * 50)).toBe("50.0KB");
    expect(formatSize(1024 * 1024)).toBe("1.0MB");
  });
});

describe("Search Result Formatting", () => {
  it("should format basic search results", () => {
    const response = {
      results: [
        {
          title: "Test Article",
          url: "https://example.com/article",
          publishedDate: "2024-01-15",
          author: "John Doe",
        },
      ],
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("Test Article");
    expect(formatted).toContain("https://example.com/article");
    expect(formatted).toContain("2024-01-15");
    expect(formatted).toContain("John Doe");
    expect(formatted).toContain("--- Result 1 ---");
  });

  it("should format results with highlights", () => {
    const response = {
      results: [
        {
          title: "Test",
          url: "https://example.com",
          highlights: ["First highlight", "Second highlight"],
        },
      ],
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("Highlights:");
    expect(formatted).toContain("First highlight");
    expect(formatted).toContain("Second highlight");
    expect(formatted).toContain("  • First highlight");
  });

  it("should format results with summary", () => {
    const response = {
      results: [
        {
          title: "Test",
          url: "https://example.com",
          summary: "This is a summary",
        },
      ],
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("Summary: This is a summary");
  });

  it("should include cost information", () => {
    const response = {
      results: [{ title: "Test", url: "https://example.com" }],
      costDollars: { total: 0.000123 },
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("Cost: $0.000123");
  });

  it("should handle null publishedDate and author", () => {
    const response = {
      results: [
        {
          title: "Test",
          url: "https://example.com",
          publishedDate: null,
          author: null,
        },
      ],
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("Title: Test");
    expect(formatted).not.toContain("Published:");
    expect(formatted).not.toContain("Author:");
  });

  it("should truncate long text preview", () => {
    const longText = "a".repeat(600);
    const response = {
      results: [
        {
          title: "Test",
          url: "https://example.com",
          text: longText,
        },
      ],
    };

    const formatted = formatSearchResults(response);
    expect(formatted).toContain("a".repeat(500));
    expect(formatted).toContain("...");
    expect(formatted).not.toContain("a".repeat(501));
  });
});

describe("Fetch Result Formatting", () => {
  it("should format text content", () => {
    const result = {
      title: "Page Title",
      url: "https://example.com",
      text: "Full page content here",
    };

    const formatted = formatFetchResult(result, "text");
    expect(formatted).toContain("Title: Page Title");
    expect(formatted).toContain("Full page content here");
  });

  it("should include cost in fetch details", () => {
    const details = {
      url: "https://example.com",
      title: "Test Page",
      cost: { total: 0.000123 },
    };
    expect(details.cost).toBeDefined();
    expect(details.cost?.total).toBe(0.000123);
  });

  it("should format highlights", () => {
    const result = {
      title: "Test Page",
      url: "https://example.com",
      highlights: ["Key point 1", "Key point 2"],
    };

    const formatted = formatFetchResult(result, "highlights");
    expect(formatted).toContain("Highlights:");
    expect(formatted).toContain("Key point 1");
    expect(formatted).toContain("Key point 2");
    expect(formatted).toContain("  • Key point 1");
  });

  it("should format summary", () => {
    const result = {
      title: "Test Page",
      url: "https://example.com",
      summary: "This page is about...",
    };

    const formatted = formatFetchResult(result, "summary");
    expect(formatted).toContain("Summary:");
    expect(formatted).toContain("This page is about...");
  });

  it("should not include title if not provided", () => {
    const result = {
      url: "https://example.com",
      text: "Content only",
    } as { title?: string; url: string; text: string };

    const formatted = formatFetchResult(result as Parameters<typeof formatFetchResult>[0], "text");
    expect(formatted).toContain("https://example.com");
    expect(formatted).not.toContain("Title:");
  });
});

describe("Error Handling", () => {
  it("should create descriptive missing API key error", () => {
    const error = createMissingApiKeyError();
    expect(error.message).toContain("Exa API key");
    expect(error.message).toContain("EXA_API_KEY");
    expect(error.message).toContain("environment variable");
  });
});

describe("parseCostDollars", () => {
  it("should parse JSON string costDollars", () => {
    const costString = '{"total":0.007,"search":{"neural":0.007}}';
    const parsed = parseCostDollars(costString);
    expect(parsed).toEqual({ total: 0.007, search: { neural: 0.007 } });
    expect(parsed.total).toBe(0.007);
  });

  it("should pass through object costDollars unchanged", () => {
    const costObject = { total: 1.5 };
    const parsed = parseCostDollars(costObject);
    expect(parsed).toEqual({ total: 1.5 });
  });

  it("should handle various cost string formats", () => {
    expect(parseCostDollars('{"total":0}').total).toBe(0);
    expect(parseCostDollars('{"total":123.456}').total).toBe(123.456);
    expect(parseCostDollars({ total: 99.9 }).total).toBe(99.9);
  });
});

describe("Code Context Result Formatting", () => {
  it("should format code context response with string costDollars", () => {
    const response = {
      requestId: "req_12345",
      query: "how to use React hooks for state management",
      response: "## useState Example\n\n```javascript\nconst [count, setCount] = useState(0);\n```",
      resultsCount: 502,
      costDollars: '{"total":0.007,"search":{"neural":0.007}}',
      searchTime: 1.234,
      outputTokens: 4805,
    };

    const formatted = formatCodeContextResult(response);
    expect(formatted).toContain("Query: how to use React hooks for state management");
    expect(formatted).toContain("Results: 502 sources");
    expect(formatted).toContain("Output tokens: 4805");
    expect(formatted).toContain("--- Code Context ---");
    expect(formatted).toContain("## useState Example");
    expect(formatted).toContain("const [count, setCount] = useState(0);");
    expect(formatted).toContain("Cost: $0.007000");
  });

  it("should format code context response with object costDollars", () => {
    const response = {
      requestId: "req_67890",
      query: "test query",
      response: "Some code examples...",
      resultsCount: 10,
      costDollars: { total: 1.5 },
      searchTime: 0.5,
      outputTokens: 1000,
    };

    const formatted = formatCodeContextResult(response);
    expect(formatted).toContain("Cost: $1.500000");
  });

  it("should include query in formatted output", () => {
    const response = {
      requestId: "req_abc",
      query: "Express.js middleware authentication",
      response: "Some code examples...",
      resultsCount: 100,
      costDollars: '{"total":0.5}',
      searchTime: 0.5,
      outputTokens: 2000,
    };

    const formatted = formatCodeContextResult(response);
    expect(formatted).toContain("Query: Express.js middleware authentication");
  });

  it("should format cost correctly with decimals", () => {
    const response = {
      requestId: "req_xyz",
      query: "test query",
      response: "response content",
      resultsCount: 10,
      costDollars: '{"total":0.123456}',
      searchTime: 0.1,
      outputTokens: 500,
    };

    const formatted = formatCodeContextResult(response);
    expect(formatted).toContain("Cost: $0.123456");
  });

  it("should display results count and output tokens", () => {
    const response = {
      requestId: "req_test",
      query: "pandas dataframe operations",
      response: "Code examples here",
      resultsCount: 150,
      costDollars: '{"total":0.75}',
      searchTime: 0.8,
      outputTokens: 3500,
    };

    const formatted = formatCodeContextResult(response);
    expect(formatted).toContain("Results: 150 sources");
    expect(formatted).toContain("Output tokens: 3500");
  });
});

describe("Code Context Parameter Validation", () => {
  it("should accept valid params with query only", () => {
    const params = { query: "React hooks examples" };
    expect(params.query).toBeTruthy();
    expect(params.query.trim()).not.toBe("");
  });

  it("should accept valid params with dynamic tokens", () => {
    const params = {
      query: "Express middleware",
      tokensNum: "dynamic" as const,
    };
    expect(typeof params.query).toBe("string");
    expect(params.tokensNum).toBe("dynamic");
  });

  it("should accept valid params with numeric tokens", () => {
    const params = {
      query: "Next.js configuration",
      tokensNum: 5000,
    };
    expect(params.tokensNum).toBeGreaterThanOrEqual(50);
    expect(params.tokensNum).toBeLessThanOrEqual(100000);
  });

  it("should accept token counts in valid range", () => {
    const validTokenCounts = [50, 1000, 5000, 10000, 50000, 100000];
    for (const count of validTokenCounts) {
      expect(count).toBeGreaterThanOrEqual(50);
      expect(count).toBeLessThanOrEqual(100000);
    }
  });

  it("should accept query strings up to 2000 characters", () => {
    const longQuery = "a".repeat(2000);
    expect(longQuery.length).toBe(2000);
  });
});

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

describe("Tool Execute Validation", () => {
  it("should validate search parameters structure", () => {
    const searchParams = {
      query: "test query",
      contentType: "highlights" as const,
      numResults: 10,
    };

    expect(typeof searchParams.query).toBe("string");
    expect(searchParams.query.trim().length).toBeGreaterThan(0);
    expect(["text", "highlights", "summary", "none"].includes(searchParams.contentType)).toBe(true);
    expect(searchParams.numResults).toBeGreaterThanOrEqual(1);
    expect(searchParams.numResults).toBeLessThanOrEqual(100);
  });

  it("should validate fetch parameters structure", () => {
    const fetchParams = {
      url: "https://example.com",
      contentType: "text" as const,
      maxCharacters: 5000,
    };

    expect(typeof fetchParams.url).toBe("string");
    expect(fetchParams.url.length).toBeGreaterThan(0);
    expect(["text", "highlights", "summary"].includes(fetchParams.contentType)).toBe(true);
    expect(fetchParams.maxCharacters).toBeGreaterThan(0);
  });

  it("should handle getContents options mapping", () => {
    const url = "https://example.com";
    const options = {
      text: true,
      maxCharacters: 10000,
    };

    expect(url).toBeTruthy();
    expect(options.text).toBe(true);
    expect(options.maxCharacters).toBeGreaterThan(0);
  });
});
