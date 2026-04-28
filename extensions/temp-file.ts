/**
 * Temp file utilities
 */

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Write content to a temporary file.
 * @param content - The content to write
 * @returns The path to the created temporary file
 */
export async function writeTempFile(content: string): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "pi-exa-"));
  const tempFile = join(tempDir, "output.txt");
  await writeFile(tempFile, content, "utf8");
  return tempFile;
}
