/**
 * Performance tests: every user-facing MCP tool must complete within 3 seconds.
 *
 * Test 1 (Simple)   — single atomic operations (mouse, keyboard, window list)
 * Test 2 (Medium)   — perform_actions with 3-step compound sequence
 * Test 3 (Complex)  — perform_actions 5-step + screenshot (heaviest real-world scenario)
 *
 * These are integration tests that actually invoke PowerShell on Windows.
 * Run with: pnpm test
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Helpers (duplicated from src to keep tests self-contained)
// ---------------------------------------------------------------------------

const MAX_ENCODED_LENGTH = 6000;

function runPS(script: string, timeout = 10000): string {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  if (encoded.length <= MAX_ENCODED_LENGTH) {
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { encoding: "utf-8", timeout },
    ).trim();
  }
  const tmpFile = join(tmpdir(), `vox-test-${randomUUID()}.ps1`);
  try {
    writeFileSync(tmpFile, script, { encoding: "utf-8" });
    return execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { encoding: "utf-8", timeout },
    ).trim();
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

function runPSVoid(script: string, timeout = 10000): void {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  if (encoded.length <= MAX_ENCODED_LENGTH) {
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
      { timeout },
    );
    return;
  }
  const tmpFile = join(tmpdir(), `vox-test-${randomUUID()}.ps1`);
  try {
    writeFileSync(tmpFile, script, { encoding: "utf-8" });
    execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout },
    );
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/** Measure wall-clock ms for a synchronous function */
function measureMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

const DEADLINE_MS = 3000;

// ---------------------------------------------------------------------------
// C# type definitions (same as hands-mcp actions.ts)
// ---------------------------------------------------------------------------

const MOUSE_CS = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseOps {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);
  public const uint LEFTDOWN = 0x0002, LEFTUP = 0x0004;
  public const uint RIGHTDOWN = 0x0008, RIGHTUP = 0x0010;
  public const uint WHEEL = 0x0800, HWHEEL = 0x1000;
}
"@
`;

const ALL_CS_TYPES = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MouseOps {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);
  public const uint LEFTDOWN = 0x0002, LEFTUP = 0x0004;
  public const uint RIGHTDOWN = 0x0008, RIGHTUP = 0x0010;
  public const uint WHEEL = 0x0800, HWHEEL = 0x1000;
}

public class WinFocus {
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  public static string Focus(string search) {
    string found = "";
    EnumWindows((hWnd, lParam) => {
      if (!IsWindowVisible(hWnd)) return true;
      int len = GetWindowTextLength(hWnd);
      if (len == 0) return true;
      var sb = new StringBuilder(len + 1);
      GetWindowText(hWnd, sb, sb.Capacity);
      if (sb.ToString().IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0) {
        ShowWindow(hWnd, 9);
        SetForegroundWindow(hWnd);
        found = sb.ToString();
        return false;
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}

public class SendInputOps {
  [StructLayout(LayoutKind.Sequential)]
  public struct INPUT { public uint type; public INPUTUNION U; }
  [StructLayout(LayoutKind.Explicit)]
  public struct INPUTUNION { [FieldOffset(0)] public KEYBDINPUT ki; }
  [StructLayout(LayoutKind.Sequential)]
  public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
  public const uint INPUT_KEYBOARD = 1;
  public const uint KEYEVENTF_UNICODE = 0x0004, KEYEVENTF_KEYUP = 0x0002;
  [DllImport("user32.dll", SetLastError = true)]
  public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
  public static void TypeUnicode(string text) {
    int size = System.Runtime.InteropServices.Marshal.SizeOf(typeof(INPUT));
    foreach (char c in text) {
      INPUT[] inputs = new INPUT[2];
      inputs[0].type = INPUT_KEYBOARD; inputs[0].U.ki.wScan = (ushort)c; inputs[0].U.ki.dwFlags = KEYEVENTF_UNICODE;
      inputs[1].type = INPUT_KEYBOARD; inputs[1].U.ki.wScan = (ushort)c; inputs[1].U.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
      SendInput(2, inputs, size);
    }
  }
}

public class ImeControl {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("imm32.dll")] static extern IntPtr ImmGetDefaultIMEWnd(IntPtr hWnd);
  [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
  public static bool GetImeStatus() {
    IntPtr hwnd = GetForegroundWindow();
    IntPtr imeWnd = ImmGetDefaultIMEWnd(hwnd);
    if (imeWnd == IntPtr.Zero) return false;
    return SendMessage(imeWnd, 0x0283, (IntPtr)5, IntPtr.Zero) != IntPtr.Zero;
  }
  public static void SetImeStatus(bool on) {
    IntPtr hwnd = GetForegroundWindow();
    IntPtr imeWnd = ImmGetDefaultIMEWnd(hwnd);
    if (imeWnd == IntPtr.Zero) return;
    SendMessage(imeWnd, 0x0283, (IntPtr)6, (IntPtr)(on ? 1 : 0));
  }
}
"@
Add-Type -AssemblyName System.Windows.Forms
`;

const WINDOW_LISTER_SCRIPT = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
using System.Diagnostics;
public class WindowLister {
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  public static string GetWindows() {
    var results = new List<string>();
    EnumWindows((hWnd, lParam) => {
      if (!IsWindowVisible(hWnd)) return true;
      int len = GetWindowTextLength(hWnd);
      if (len == 0) return true;
      var sb = new StringBuilder(len + 1);
      GetWindowText(hWnd, sb, sb.Capacity);
      RECT rect; GetWindowRect(hWnd, out rect);
      uint pid; GetWindowThreadProcessId(hWnd, out pid);
      string procName = "";
      try { procName = Process.GetProcessById((int)pid).ProcessName; } catch {}
      results.Add(sb.ToString() + "|" + procName + "|" + rect.Left + "|" + rect.Top + "|" + (rect.Right-rect.Left) + "|" + (rect.Bottom-rect.Top));
      return true;
    }, IntPtr.Zero);
    return string.Join(Environment.NewLine, results);
  }
}
"@
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output ([WindowLister]::GetWindows())
`;

// Screenshot helper (from screen-mcp)
function screenshotScript(): string {
  return `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen(0, 0, 0, 0, $bounds.Size)
$ms = New-Object System.IO.MemoryStream
$bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output ([Convert]::ToBase64String($ms.ToArray()))
$ms.Dispose()
`;
}

// =========================================================================
// Test 1: Simple — single atomic operations
// =========================================================================

describe("Simple: single atomic operations < 3s", () => {
  it("mouse_click (SetCursorPos + mouse_event)", () => {
    const ms = measureMs(() => {
      runPSVoid(`${MOUSE_CS}
[MouseOps]::SetCursorPos(100,100)
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)`);
    });
    console.log(`  mouse_click: ${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(DEADLINE_MS);
  });

  it("press_key (SendKeys Enter)", () => {
    const ms = measureMs(() => {
      runPSVoid(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`);
    });
    console.log(`  press_key: ${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(DEADLINE_MS);
  });

  it("list_windows (EnumWindows + Process info)", () => {
    let output = "";
    const ms = measureMs(() => {
      output = runPS(WINDOW_LISTER_SCRIPT);
    });
    const windowCount = output.split("\n").filter((l) => l.trim()).length;
    console.log(`  list_windows: ${ms.toFixed(0)} ms (${windowCount} windows)`);
    expect(ms).toBeLessThan(DEADLINE_MS);
    expect(windowCount).toBeGreaterThan(0);
  });
});

// =========================================================================
// Test 2: Medium — perform_actions 3-step compound
// =========================================================================

describe("Medium: 3-step perform_actions < 3s", () => {
  it("focus + click + type (single PS process)", () => {
    // Simulates: focus a window, click at coords, type short text
    const delay = 200;
    const script = `${ALL_CS_TYPES}
# Action 1: focus (will find any window — no-op if not found is fine)
$r = [WinFocus]::Focus('Notepad')
Write-Output "focused:$r"
Start-Sleep -Milliseconds ${delay}

# Action 2: click
[MouseOps]::SetCursorPos(200,200)
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)
Write-Output "clicked:200,200"
Start-Sleep -Milliseconds ${delay}

# Action 3: type short text with IME guard
$prevIme = [ImeControl]::GetImeStatus()
[ImeControl]::SetImeStatus($false)
[SendInputOps]::TypeUnicode('hello')
[ImeControl]::SetImeStatus($prevIme)
Write-Output "typed:5 chars"
`;
    let output = "";
    const ms = measureMs(() => {
      output = runPS(script, 10000);
    });
    const lines = output.split("\n").filter((l) => l.trim());
    console.log(`  3-step: ${ms.toFixed(0)} ms — [${lines.join(", ")}]`);
    expect(ms).toBeLessThan(DEADLINE_MS);
    // Should have completed at least 3 action outputs
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });
});

// =========================================================================
// Test 3: Complex — 5-step perform_actions + screenshot
// =========================================================================

describe("Complex: 5-step actions + screenshot < 3s each", () => {
  it("5-step perform_actions (focus + click + scroll + type + hotkey)", () => {
    const delay = 100; // tighter delay for 5 steps
    const script = `${ALL_CS_TYPES}
# Action 1: focus
$r = [WinFocus]::Focus('Explorer')
Write-Output "focused:$r"
Start-Sleep -Milliseconds ${delay}

# Action 2: click
[MouseOps]::SetCursorPos(300,300)
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)
Write-Output "clicked:300,300"
Start-Sleep -Milliseconds ${delay}

# Action 3: scroll down
[MouseOps]::mouse_event([MouseOps]::WHEEL,0,0,-360,[IntPtr]::Zero)
Write-Output "scrolled:down,3"
Start-Sleep -Milliseconds ${delay}

# Action 4: type with IME guard
$prevIme = [ImeControl]::GetImeStatus()
[ImeControl]::SetImeStatus($false)
[SendInputOps]::TypeUnicode('test input')
[ImeControl]::SetImeStatus($prevIme)
Write-Output "typed:10 chars"
Start-Sleep -Milliseconds ${delay}

# Action 5: hotkey Ctrl+A (select all)
[System.Windows.Forms.SendKeys]::SendWait('^a')
Write-Output "hotkey:ctrl+a"
`;
    let output = "";
    const ms = measureMs(() => {
      output = runPS(script, 10000);
    });
    const lines = output.split("\n").filter((l) => l.trim());
    console.log(`  5-step: ${ms.toFixed(0)} ms — [${lines.join(", ")}]`);
    expect(ms).toBeLessThan(DEADLINE_MS);
    expect(lines.length).toBeGreaterThanOrEqual(5);
  });

  it("screenshot (full screen capture + base64 encode)", () => {
    let b64Length = 0;
    const ms = measureMs(() => {
      const output = runPS(screenshotScript(), 10000);
      b64Length = output.length;
    });
    console.log(`  screenshot: ${ms.toFixed(0)} ms (${(b64Length / 1024).toFixed(0)} KB base64)`);
    expect(ms).toBeLessThan(DEADLINE_MS);
    expect(b64Length).toBeGreaterThan(1000); // sanity: got actual image data
  });
});
