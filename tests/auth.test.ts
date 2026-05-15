import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { createMissingApiKeyError } from "../extensions/errors.ts";

vi.mock("node:fs/promises");
vi.mock("node:os");

const mockedFs = vi.mocked(fs);
const mockedOs = vi.mocked(os);

describe("resolveAuth", () => {
  beforeEach(() => {
    mockedOs.homedir.mockReturnValue("/home/testuser");
    delete process.env.EXA_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers file key over environment variable", async () => {
    mockedFs.readFile.mockResolvedValue(JSON.stringify({ exaApiKey: "file-key" }));
    process.env.EXA_API_KEY = "env-key";

    const { resolveAuth } = await import("../extensions/auth.ts");
    const result = await resolveAuth();

    expect(result.key).toBe("file-key");
    expect(result.source).toBe("file");
    expect(result.warnings).toEqual([]);
  });

  it("falls back to env var when file contains an invalid key", async () => {
    mockedFs.readFile.mockResolvedValue(JSON.stringify({ exaApiKey: "" }));
    process.env.EXA_API_KEY = "env-key";

    const { resolveAuth } = await import("../extensions/auth.ts");
    const result = await resolveAuth();

    expect(result.key).toBe("env-key");
    expect(result.source).toBe("env");
    expect(result.warnings).toEqual([]);
  });

  it("falls back to env var when file is absent", async () => {
    mockedFs.readFile.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    process.env.EXA_API_KEY = "env-key";

    const { resolveAuth } = await import("../extensions/auth.ts");
    const result = await resolveAuth();

    expect(result.key).toBe("env-key");
    expect(result.source).toBe("env");
    expect(result.warnings).toEqual([]);
  });

  it("returns unconfigured when no auth source is available", async () => {
    mockedFs.readFile.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const { resolveAuth } = await import("../extensions/auth.ts");
    const result = await resolveAuth();

    expect(result.key).toBeUndefined();
    expect(result.source).toBe("none");
    expect(result.configured).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it("warns on unexpected file errors but stays silent for missing files", async () => {
    const { resolveAuth } = await import("../extensions/auth.ts");

    // Malformed JSON produces a warning
    mockedFs.readFile.mockResolvedValue("not json");
    const withBadJson = await resolveAuth();
    expect(withBadJson.warnings).toHaveLength(1);
    expect(withBadJson.warnings[0]).toContain("Could not read");

    // Permission error produces a warning
    mockedFs.readFile.mockRejectedValue(
      Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" }),
    );
    const withPermissionError = await resolveAuth();
    expect(withPermissionError.warnings).toHaveLength(1);
    expect(withPermissionError.warnings[0]).toContain("EACCES");

    // Missing file is silent
    mockedFs.readFile.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    const withMissingFile = await resolveAuth();
    expect(withMissingFile.warnings).toEqual([]);
  });
});

describe("createMissingApiKeyError", () => {
  it("references both configuration methods", () => {
    const error = createMissingApiKeyError();
    expect(error.message).toContain("EXA_API_KEY");
    expect(error.message).toContain("exa-auth.json");
  });
});
