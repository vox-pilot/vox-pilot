import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { runPSEncoded } from "./powershell.js";

function captureToPng(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const tmpFile = join(tmpdir(), `vox-pilot-${randomUUID()}.png`);
  const escapedPath = tmpFile.replace(/\\/g, "\\\\");

  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap(${width}, ${height})
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen(${x}, ${y}, 0, 0, [System.Drawing.Size]::new(${width}, ${height}))
$bitmap.Save('${escapedPath}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`;

  runPSEncoded(psScript, 10000);

  const buffer = readFileSync(tmpFile);
  try {
    unlinkSync(tmpFile);
  } catch {
    // ignore cleanup errors
  }
  return buffer.toString("base64");
}

function getScreenSize(): { width: number; height: number } {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width.ToString() + ',' + [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height.ToString()
`;
  const output = runPSEncoded(script, 5000);
  const [w, h] = output.split(",").map(Number);
  return { width: w, height: h };
}

export async function captureScreenshot(): Promise<string> {
  const { width, height } = getScreenSize();
  return captureToPng(0, 0, width, height);
}

export async function captureRegion(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  return captureToPng(x, y, width, height);
}
