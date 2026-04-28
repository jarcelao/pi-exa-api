import { describe, it, expect } from "vitest";
import {
  formatSearchResults,
  formatFetchResult,
  formatCodeContextResult,
  parseCostDollars,
} from "../extensions/index.ts";

describe("formatSearchResults", () => {
  it("should format basic result fields", () => {
    const formatted = formatSearchResults({
      results: [
        {
          title: "Test Article",
          url: "https://example.com/article",
          publishedDate: "2024-01-15",
          author: "John Doe",
        },
      ],
    });
    expect(formatted).toContain("--- Result 1 ---");
    expect(formatted).toContain("Title: Test Article");
    expect(formatted).toContain("URL: https://example.com/article");
    expect(formatted).toContain("Published: 2024-01-15");
    expect(formatted).toContain("Author: John Doe");
  });

  it("should omit publishedDate and author when null", () => {
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com", publishedDate: null, author: null }],
    });
    expect(formatted).toContain("Title: Test");
    expect(formatted).not.toContain("Published:");
    expect(formatted).not.toContain("Author:");
  });

  it("should format highlights with bullet points", () => {
    const formatted = formatSearchResults({
      results: [
        { title: "Test", url: "https://example.com", highlights: ["First highlight", "Second highlight"] },
      ],
    });
    expect(formatted).toContain("Highlights:");
    expect(formatted).toContain("  • First highlight");
    expect(formatted).toContain("  • Second highlight");
  });

  it("should format summary inline", () => {
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com", summary: "This is a summary" }],
    });
    expect(formatted).toContain("Summary: This is a summary");
  });

  it("should truncate text preview to 500 characters", () => {
    const longText = "a".repeat(600);
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com", text: longText }],
    });
    expect(formatted).toContain("a".repeat(500));
    expect(formatted).toContain("...");
    expect(formatted).not.toContain("a".repeat(501));
  });

  it("should not append ellipsis for short text", () => {
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com", text: "short" }],
    });
    expect(formatted).toContain("Text: short");
    expect(formatted).not.toContain("short...");
  });

  it("should include cost when provided", () => {
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com" }],
      costDollars: { total: 0.000123 },
    });
    expect(formatted).toContain("Cost: $0.000123");
  });

  it("should omit cost line when not provided", () => {
    const formatted = formatSearchResults({
      results: [{ title: "Test", url: "https://example.com" }],
    });
    expect(formatted).not.toContain("Cost:");
  });

  it("should number multiple results sequentially", () => {
    const formatted = formatSearchResults({
      results: [
        { title: "First", url: "https://a.com" },
        { title: "Second", url: "https://b.com" },
        { title: "Third", url: "https://c.com" },
      ],
    });
    expect(formatted).toContain("--- Result 1 ---");
    expect(formatted).toContain("--- Result 2 ---");
    expect(formatted).toContain("--- Result 3 ---");
  });
});

describe("formatFetchResult", () => {
  it("should format text content", () => {
    const formatted = formatFetchResult(
      { title: "Page Title", url: "https://example.com", text: "Full page content" },
      "text",
    );
    expect(formatted).toContain("Title: Page Title");
    expect(formatted).toContain("Full page content");
  });

  it("should format highlights with bullet points", () => {
    const formatted = formatFetchResult(
      { title: "Test", url: "https://example.com", highlights: ["Key point 1", "Key point 2"] },
      "highlights",
    );
    expect(formatted).toContain("Highlights:");
    expect(formatted).toContain("  • Key point 1");
    expect(formatted).toContain("  • Key point 2");
  });

  it("should format summary", () => {
    const formatted = formatFetchResult(
      { title: "Test", url: "https://example.com", summary: "This page is about..." },
      "summary",
    );
    expect(formatted).toContain("Summary:");
    expect(formatted).toContain("This page is about...");
  });

  it("should omit title when not provided", () => {
    const formatted = formatFetchResult(
      { url: "https://example.com", text: "Content only" } as Parameters<typeof formatFetchResult>[0],
      "text",
    );
    expect(formatted).toContain("URL: https://example.com");
    expect(formatted).not.toContain("Title:");
  });

  it("should handle empty highlights array", () => {
    const formatted = formatFetchResult(
      { title: "Test", url: "https://example.com", highlights: [] },
      "highlights",
    );
    expect(formatted).toContain("URL: https://example.com");
    expect(formatted).not.toContain("Highlights:");
  });

  it("should handle missing text for text contentType", () => {
    const formatted = formatFetchResult(
      { title: "Test", url: "https://example.com" },
      "text",
    );
    expect(formatted).toContain("URL: https://example.com");
    // No text section should appear
    expect(formatted).not.toContain("Text:");
  });
});

describe("parseCostDollars", () => {
  it("should parse JSON string costDollars", () => {
    const parsed = parseCostDollars('{"total":0.007,"search":{"neural":0.007}}');
    expect(parsed).toEqual({ total: 0.007, search: { neural: 0.007 } });
  });

  it("should pass through object costDollars unchanged", () => {
    const costObject = { total: 1.5 };
    expect(parseCostDollars(costObject)).toBe(costObject);
  });

  it("should handle zero cost", () => {
    expect(parseCostDollars('{"total":0}').total).toBe(0);
  });
});

describe("formatCodeContextResult", () => {
  const baseResponse = {
    requestId: "req_123",
    query: "React hooks state management",
    response: "## Example\n\n```js\nconst [count, setCount] = useState(0);\n```",
    resultsCount: 502,
    costDollars: '{"total":0.007}',
    searchTime: 1.234,
    outputTokens: 4805,
  };

  it("should include all key fields", () => {
    const formatted = formatCodeContextResult(baseResponse);
    expect(formatted).toContain("Query: React hooks state management");
    expect(formatted).toContain("Results: 502 sources");
    expect(formatted).toContain("Output tokens: 4805");
    expect(formatted).toContain("--- Code Context ---");
    expect(formatted).toContain("## Example");
  });

  it("should format cost from JSON string", () => {
    const formatted = formatCodeContextResult(baseResponse);
    expect(formatted).toContain("Cost: $0.007000");
  });

  it("should format cost from object", () => {
    const formatted = formatCodeContextResult({ ...baseResponse, costDollars: { total: 1.5 } });
    expect(formatted).toContain("Cost: $1.500000");
  });

  it("should format cost with full decimal precision", () => {
    const formatted = formatCodeContextResult({ ...baseResponse, costDollars: '{"total":0.123456}' });
    expect(formatted).toContain("Cost: $0.123456");
  });
});
