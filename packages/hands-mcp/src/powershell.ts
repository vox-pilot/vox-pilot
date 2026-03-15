import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// Windows command line limit is ~8191 chars.
// Base64 expands by ~1.37x, plus 'powershell -EncodedCommand ' prefix.
// Use temp file when script is large.
const MAX_ENCODED_LENGTH = 6000;

/**
 * Execute a PowerShell script reliably.
 * Uses -EncodedCommand for short scripts, temp file for long ones.
 */
export function runPSEncoded(script: string, timeout = 10000): string {
  const encoded = Buffer.from(script, "utf16le").toString("base64");

  if (encoded.length <= MAX_ENCODED_LENGTH) {
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { encoding: "utf-8", timeout }
    ).trim();
  }

  // Use temp file for long scripts
  const tmpFile = join(tmpdir(), `vox-pilot-${randomUUID()}.ps1`);
  try {
    writeFileSync(tmpFile, script, { encoding: "utf-8" });
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { encoding: "utf-8", timeout }
    ).trim();
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/**
 * Execute a PowerShell script and ignore output.
 */
export function runPSEncodedVoid(script: string, timeout = 10000): void {
  const encoded = Buffer.from(script, "utf16le").toString("base64");

  if (encoded.length <= MAX_ENCODED_LENGTH) {
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { timeout }
    );
    return;
  }

  const tmpFile = join(tmpdir(), `vox-pilot-${randomUUID()}.ps1`);
  try {
    writeFileSync(tmpFile, script, { encoding: "utf-8" });
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout }
    );
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
