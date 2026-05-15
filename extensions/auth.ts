/**
 * Deep module encapsulating all credential resolution logic
 */
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const PI_AGENT_CONFIG_DIR = join(homedir(), ".pi", "agent");
const EXA_AUTH_FILE_PATH = join(PI_AGENT_CONFIG_DIR, "exa-auth.json");

export interface AuthResult {
  key: string | undefined;
  source: "file" | "env" | "none";
  configured: boolean;
  warnings: string[];
}

/**
 * Single entry point for auth resolution.
 * Returns the key (if found), the source, and any warnings generated during resolution.
 * File-based auth takes priority over the environment variable.
 */
export async function resolveAuth(): Promise<AuthResult> {
  const warnings: string[] = [];
  const fileKey = await tryReadFileKey(warnings);

  if (fileKey) {
    return { key: fileKey, source: "file", configured: true, warnings };
  }

  const envKey = process.env.EXA_API_KEY;
  if (envKey && envKey.length > 0) {
    return { key: envKey, source: "env", configured: true, warnings: [] };
  }

  warnings.push(
    `No Exa API key found. Set the EXA_API_KEY environment variable or create ${EXA_AUTH_FILE_PATH} with an "exaApiKey" field.`,
  );
  return { key: undefined, source: "none", configured: false, warnings };
}

/** Attempt to read exaApiKey from the config file, returning undefined on any error. */
async function tryReadFileKey(warnings: string[]): Promise<string | undefined> {
  try {
    const raw = await readFile(EXA_AUTH_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const key = parsed.exaApiKey;
    if (key && typeof key === "string" && key.trim().length > 0) {
      return key;
    }
    return undefined;
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      warnings.push(
        `API key file not found at ${EXA_AUTH_FILE_PATH}`,
      );
      return undefined;
    }
    const message = err instanceof Error ? err.message : String(err);
    warnings.push(`Could not read ${EXA_AUTH_FILE_PATH}: ${message}`);
    return undefined;
  }
}
