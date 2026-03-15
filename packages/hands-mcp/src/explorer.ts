import { execSync } from "node:child_process";

export async function openPath(path: string): Promise<void> {
  // Use explorer.exe to open files/folders with the default application
  const normalized = path.replace(/\//g, "\\");
  execSync(`explorer.exe "${normalized}"`, { timeout: 5000 });
}

export async function focusWindow(name: string): Promise<string> {
  const psScript = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
using System.Text;
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
'@
[WinFocus]::Focus('${name.replace(/'/g, "''")}')
  `;

  const result = execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { encoding: "utf-8", timeout: 5000 }
  ).trim();

  if (result) {
    return `Focused window: ${result}`;
  }
  return `No window found matching: ${name}`;
}
