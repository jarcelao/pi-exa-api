import { describe, it, expect, afterEach } from "vitest";
import { getApiKey } from "../extensions/api-key.ts";
import { createMissingApiKeyError } from "../extensions/errors.ts";

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

describe("Error Handling", () => {
  it("should create descriptive missing API key error", () => {
    const error = createMissingApiKeyError();
    expect(error.message).toContain("Exa API key");
    expect(error.message).toContain("EXA_API_KEY");
    expect(error.message).toContain("environment variable");
  });
});
