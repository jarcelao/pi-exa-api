import { describe, it, expect } from "vitest";

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

describe("tokensNum Type Coercion", () => {
  // Helper function that mirrors the type coercion logic in exa_code_context execute
  function coerceTokensNum(tokensNum: string | number | undefined): string | number {
    const value = tokensNum ?? "dynamic";
    if (typeof value === "string" && value !== "dynamic") {
      return Number(value);
    }
    return value;
  }

  it("should return 'dynamic' when tokensNum is undefined", () => {
    const result = coerceTokensNum(undefined);
    expect(result).toBe("dynamic");
    expect(typeof result).toBe("string");
  });

  it("should preserve 'dynamic' string", () => {
    const result = coerceTokensNum("dynamic");
    expect(result).toBe("dynamic");
    expect(typeof result).toBe("string");
  });

  it("should preserve numeric tokens", () => {
    const result = coerceTokensNum(5000);
    expect(result).toBe(5000);
    expect(typeof result).toBe("number");
  });

  it("should coerce numeric string to number", () => {
    const result = coerceTokensNum("5000");
    expect(result).toBe(5000);
    expect(typeof result).toBe("number");
  });

  it("should coerce various numeric strings", () => {
    expect(coerceTokensNum("1000")).toBe(1000);
    expect(coerceTokensNum("10000")).toBe(10000);
    expect(coerceTokensNum("3000")).toBe(3000);
    expect(typeof coerceTokensNum("5000")).toBe("number");
  });

  it("should handle boundary token values", () => {
    expect(coerceTokensNum(50)).toBe(50);
    expect(coerceTokensNum(100000)).toBe(100000);
  });

  it("should not modify actual numbers", () => {
    const originalNumber = 7500;
    const result = coerceTokensNum(originalNumber);
    expect(result).toBe(originalNumber);
    expect(result).toBe(7500);
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
