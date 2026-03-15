import { runPSEncoded, runPSEncodedVoid } from "./powershell.js";

const IME_CS = `
Add-Type -TypeDefinition @"
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
"@
`;

const SENDINPUT_CS = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class SendInputOps {
  [StructLayout(LayoutKind.Sequential)]
  public struct INPUT {
    public uint type;
    public INPUTUNION U;
  }
  [StructLayout(LayoutKind.Explicit)]
  public struct INPUTUNION {
    [FieldOffset(0)] public KEYBDINPUT ki;
  }
  [StructLayout(LayoutKind.Sequential)]
  public struct KEYBDINPUT {
    public ushort wVk;
    public ushort wScan;
    public uint dwFlags;
    public uint time;
    public IntPtr dwExtraInfo;
  }
  public const uint INPUT_KEYBOARD = 1;
  public const uint KEYEVENTF_UNICODE = 0x0004;
  public const uint KEYEVENTF_KEYUP = 0x0002;
  [DllImport("user32.dll", SetLastError = true)]
  public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
  public static void TypeUnicode(string text) {
    int size = Marshal.SizeOf(typeof(INPUT));
    foreach (char c in text) {
      INPUT[] inputs = new INPUT[2];
      inputs[0].type = INPUT_KEYBOARD;
      inputs[0].U.ki.wScan = (ushort)c;
      inputs[0].U.ki.dwFlags = KEYEVENTF_UNICODE;
      inputs[1].type = INPUT_KEYBOARD;
      inputs[1].U.ki.wScan = (ushort)c;
      inputs[1].U.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
      SendInput(2, inputs, size);
    }
  }
}
"@
`;

// Map common key names to SendKeys format (used for special keys only)
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
  f1: "{F1}",  f2: "{F2}",  f3: "{F3}",  f4: "{F4}",
  f5: "{F5}",  f6: "{F6}",  f7: "{F7}",  f8: "{F8}",
  f9: "{F9}",  f10: "{F10}", f11: "{F11}", f12: "{F12}",
  space: " ",
};

function disableImeAndGetPrevState(): boolean {
  const result = runPSEncoded(
    `${IME_CS}
$prev = [ImeControl]::GetImeStatus()
[ImeControl]::SetImeStatus($false)
Write-Output $prev`
  );
  return result === "True";
}

function restoreIme(wasOn: boolean): void {
  if (wasOn) {
    runPSEncodedVoid(`${IME_CS}
[ImeControl]::SetImeStatus($true)`);
  }
}

export async function typeText(text: string): Promise<void> {
  // Disable IME, type via SendInput (Unicode), restore IME
  const wasImeOn = disableImeAndGetPrevState();

  try {
    // Escape single quotes for PowerShell string
    const escaped = text.replace(/'/g, "''");
    runPSEncodedVoid(`${SENDINPUT_CS}
[SendInputOps]::TypeUnicode('${escaped}')`);
  } finally {
    restoreIme(wasImeOn);
  }
}

export async function pressKey(key: string): Promise<void> {
  const mapped = KEY_MAP[key.toLowerCase()] ?? key;
  const escaped = mapped.replace(/'/g, "''");
  runPSEncodedVoid(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${escaped}')`);
}

export async function hotkey(keys: string[]): Promise<void> {
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
  const escaped = combo.replace(/'/g, "''");
  runPSEncodedVoid(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${escaped}')`);
}
