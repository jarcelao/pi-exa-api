import { describe, it, expect } from "vitest";
import {
  truncateHead,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
} from "@mariozechner/pi-coding-agent";

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
