import { describe, it, expect } from "vitest";
import { mapSearchContentType, mapFetchContentType } from "../extensions/index.ts";

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
