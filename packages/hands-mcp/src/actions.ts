import { runPSEncoded } from "./powershell.js";

export interface Action {
  action: string;
  window?: string;
  x?: number;
  y?: number;
  direction?: string;
  amount?: number;
  text?: string;
  key?: string;
  keys?: string[];
  ms?: number;
}

// C# types for mouse, keyboard, window, and IME operations
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

// SendKeys key map for special keys
const KEY_MAP: Record<string, string> = {
  enter: "{ENTER}", tab: "{TAB}", escape: "{ESC}",
  backspace: "{BACKSPACE}", delete: "{DELETE}",
  up: "{UP}", down: "{DOWN}", left: "{LEFT}", right: "{RIGHT}",
  home: "{HOME}", end: "{END}", pageup: "{PGUP}", pagedown: "{PGDN}",
  f1: "{F1}", f2: "{F2}", f3: "{F3}", f4: "{F4}",
  f5: "{F5}", f6: "{F6}", f7: "{F7}", f8: "{F8}",
  f9: "{F9}", f10: "{F10}", f11: "{F11}", f12: "{F12}",
  space: " ",
};

export function buildActionPS(action: Action): string {
  switch (action.action) {
    case "focus":
      return `$r = [WinFocus]::Focus('${(action.window ?? "").replace(/'/g, "''")}')
Write-Output "focused:$r"`;

    case "click":
      return `[MouseOps]::SetCursorPos(${action.x},${action.y})
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)
Write-Output "clicked:${action.x},${action.y}"`;

    case "double_click":
      return `[MouseOps]::SetCursorPos(${action.x},${action.y})
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)
Start-Sleep -Milliseconds 50
[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::LEFTUP,0,0,0,[IntPtr]::Zero)
Write-Output "double_clicked:${action.x},${action.y}"`;

    case "right_click":
      return `[MouseOps]::SetCursorPos(${action.x},${action.y})
[MouseOps]::mouse_event([MouseOps]::RIGHTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::RIGHTUP,0,0,0,[IntPtr]::Zero)
Write-Output "right_clicked:${action.x},${action.y}"`;

    case "scroll": {
      const delta = 120 * (action.amount ?? 3);
      const dir = action.direction ?? "down";
      if (dir === "up" || dir === "down") {
        const val = dir === "up" ? delta : -delta;
        return `[MouseOps]::mouse_event([MouseOps]::WHEEL,0,0,${val},[IntPtr]::Zero)
Write-Output "scrolled:${dir},${action.amount ?? 3}"`;
      } else {
        const val = dir === "right" ? delta : -delta;
        return `[MouseOps]::mouse_event([MouseOps]::HWHEEL,0,0,${val},[IntPtr]::Zero)
Write-Output "scrolled:${dir},${action.amount ?? 3}"`;
      }
    }

    case "type": {
      const escaped = (action.text ?? "").replace(/'/g, "''");
      return `$prevIme = [ImeControl]::GetImeStatus()
[ImeControl]::SetImeStatus($false)
[SendInputOps]::TypeUnicode('${escaped}')
[ImeControl]::SetImeStatus($prevIme)
Write-Output "typed:${(action.text ?? "").length} chars"`;
    }

    case "key": {
      const mapped = KEY_MAP[(action.key ?? "").toLowerCase()] ?? (action.key ?? "");
      const escaped = mapped.replace(/'/g, "''");
      return `[System.Windows.Forms.SendKeys]::SendWait('${escaped}')
Write-Output "key:${action.key}"`;
    }

    case "hotkey": {
      let prefix = "";
      const regular: string[] = [];
      for (const k of action.keys ?? []) {
        const lower = k.toLowerCase();
        if (lower === "ctrl" || lower === "control") prefix += "^";
        else if (lower === "alt") prefix += "%";
        else if (lower === "shift") prefix += "+";
        else regular.push(KEY_MAP[lower] ?? lower);
      }
      const combo = (prefix + regular.join("")).replace(/'/g, "''");
      return `[System.Windows.Forms.SendKeys]::SendWait('${combo}')
Write-Output "hotkey:${(action.keys ?? []).join("+")}"`;
    }

    case "wait":
      return `Start-Sleep -Milliseconds ${action.ms ?? 300}
Write-Output "waited:${action.ms ?? 300}ms"`;

    default:
      return `Write-Output "unknown:${action.action}"`;
  }
}

export interface ActionResult {
  completed: string[];
  error?: string;
}

export function buildPerformActionsScript(
  actions: Action[],
  delayBetweenMs: number
): string {
  // Build a single PowerShell script with all actions
  const parts: string[] = [ALL_CS_TYPES];

  for (let i = 0; i < actions.length; i++) {
    parts.push(`# Action ${i + 1}: ${actions[i].action}`);
    parts.push(buildActionPS(actions[i]));
    if (i < actions.length - 1 && delayBetweenMs > 0) {
      parts.push(`Start-Sleep -Milliseconds ${delayBetweenMs}`);
    }
  }

  return parts.join("\n");
}

export async function performActions(
  actions: Action[],
  delayBetweenMs: number
): Promise<ActionResult> {
  const script = buildPerformActionsScript(actions, delayBetweenMs);

  try {
    const output = runPSEncoded(script, 30000);
    const lines = output.split("\n").filter((l) => l.trim());
    return { completed: lines };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { completed: [], error: msg };
  }
}
