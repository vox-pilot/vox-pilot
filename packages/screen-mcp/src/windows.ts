import { execSync } from "node:child_process";

export interface WindowInfo {
  title: string;
  processName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function listWindows(): Promise<WindowInfo[]> {
  // Use PowerShell to enumerate visible windows
  const psScript = `
    Add-Type @"
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
        return string.Join("\\n", results);
      }
    }
"@
    [WindowLister]::GetWindows()
  `;

  const output = execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { encoding: "utf-8", timeout: 10000 }
  );

  return output
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [title, processName, x, y, width, height] = line.split("|");
      return {
        title: title ?? "",
        processName: processName ?? "",
        x: parseInt(x ?? "0", 10),
        y: parseInt(y ?? "0", 10),
        width: parseInt(width ?? "0", 10),
        height: parseInt(height ?? "0", 10),
      };
    });
}

export async function getWindowInfo(
  name: string
): Promise<WindowInfo | null> {
  const windows = await listWindows();
  const lower = name.toLowerCase();
  return (
    windows.find(
      (w) =>
        w.title.toLowerCase().includes(lower) ||
        w.processName.toLowerCase().includes(lower)
    ) ?? null
  );
}
