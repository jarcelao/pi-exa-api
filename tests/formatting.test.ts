import { describe, it, expect } from "vitest";
import {
  formatSearchResults,
  formatFetchResult,
  formatCodeContextResult,
  parseCostDollars,
} from "../extensions/index.ts";

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
