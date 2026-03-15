import { execSync } from "node:child_process";

function runPS(script: string): void {
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`,
    { timeout: 5000 }
  );
}

function runPSOutput(script: string): string {
  return execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 5000 }
  ).trim();
}

const IME_SETUP = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class ImeControl {
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("imm32.dll")] static extern IntPtr ImmGetDefaultIMEWnd(IntPtr hWnd);
  [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
  const uint WM_IME_CONTROL = 0x0283;
  const int IMC_GETOPENSTATUS = 0x0005;
  const int IMC_SETOPENSTATUS = 0x0006;

  public static bool GetImeStatus() {
    IntPtr hwnd = GetForegroundWindow();
    IntPtr imeWnd = ImmGetDefaultIMEWnd(hwnd);
    if (imeWnd == IntPtr.Zero) return false;
    return SendMessage(imeWnd, WM_IME_CONTROL, (IntPtr)IMC_GETOPENSTATUS, IntPtr.Zero) != IntPtr.Zero;
  }

  public static void SetImeStatus(bool on) {
    IntPtr hwnd = GetForegroundWindow();
    IntPtr imeWnd = ImmGetDefaultIMEWnd(hwnd);
    if (imeWnd == IntPtr.Zero) return;
    SendMessage(imeWnd, WM_IME_CONTROL, (IntPtr)IMC_SETOPENSTATUS, (IntPtr)(on ? 1 : 0));
  }
}
'@
`;

function disableImeAndGetPrevState(): boolean {
  const result = runPSOutput(
    `${IME_SETUP}; $prev = [ImeControl]::GetImeStatus(); [ImeControl]::SetImeStatus($false); Write-Output $prev`
  );
  return result === "True";
}

function restoreIme(wasOn: boolean): void {
  if (wasOn) {
    runPS(`${IME_SETUP}; [ImeControl]::SetImeStatus($true)`);
  }
}

// Map common key names to SendKeys format
const KEY_MAP: Record<string, string> = {
  enter: "{ENTER}",
  tab: "{TAB}",
  escape: "{ESC}",
  backspace: "{BACKSPACE}",
  delete: "{DELETE}",
  up: "{UP}",
  down: "{DOWN}",
  left: "{LEFT}",
  right: "{RIGHT}",
  home: "{HOME}",
  end: "{END}",
  pageup: "{PGUP}",
  pagedown: "{PGDN}",
  f1: "{F1}",
  f2: "{F2}",
  f3: "{F3}",
  f4: "{F4}",
  f5: "{F5}",
  f6: "{F6}",
  f7: "{F7}",
  f8: "{F8}",
  f9: "{F9}",
  f10: "{F10}",
  f11: "{F11}",
  f12: "{F12}",
  space: " ",
};

export async function typeText(text: string): Promise<void> {
  // Disable IME before typing, restore after
  const wasImeOn = disableImeAndGetPrevState();

  try {
    // Escape special SendKeys characters
    const escaped = text.replace(/[+^%~(){}[\]]/g, "{$&}");
    runPS(
      `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escaped.replace(/'/g, "''")}')`
    );
  } finally {
    restoreIme(wasImeOn);
  }
}

export async function pressKey(key: string): Promise<void> {
  const mapped = KEY_MAP[key.toLowerCase()] ?? key;
  runPS(
    `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${mapped.replace(/'/g, "''")}')`
  );
}

export async function hotkey(keys: string[]): Promise<void> {
  // Build SendKeys combo: ctrl=^, alt=%, shift=+
  let prefix = "";
  const regularKeys: string[] = [];

  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower === "ctrl" || lower === "control") {
      prefix += "^";
    } else if (lower === "alt") {
      prefix += "%";
    } else if (lower === "shift") {
      prefix += "+";
    } else {
      regularKeys.push(KEY_MAP[lower] ?? lower);
    }
  }

  const combo = prefix + regularKeys.join("");
  runPS(
    `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${combo.replace(/'/g, "''")}')`
  );
}
