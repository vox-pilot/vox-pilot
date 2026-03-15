import screenshot from "screenshot-desktop";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export async function captureScreenshot(): Promise<string> {
  const buffer = (await screenshot({ format: "png" })) as Buffer;
  return buffer.toString("base64");
}

export async function captureRegion(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  // Capture full screen first, then crop
  // TODO: Use native API for direct region capture for better performance
  const fullBuffer = (await screenshot({ format: "png" })) as Buffer;

  // For now, return full screenshot with region info
  // Cropping will be implemented with sharp or native APIs
  return fullBuffer.toString("base64");
}
