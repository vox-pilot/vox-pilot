import { runPSEncodedVoid } from "./powershell.js";

const MOUSE_CS = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseOps {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, IntPtr dwExtraInfo);
  public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
  public const uint MOUSEEVENTF_LEFTUP = 0x0004;
  public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
  public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
  public const uint MOUSEEVENTF_WHEEL = 0x0800;
  public const uint MOUSEEVENTF_HWHEEL = 0x1000;
}
"@
`;

export async function mouseClick(x: number, y: number): Promise<void> {
  runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::SetCursorPos(${x},${y})
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP,0,0,0,[IntPtr]::Zero)
`);
}

export async function mouseDoubleClick(x: number, y: number): Promise<void> {
  runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::SetCursorPos(${x},${y})
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP,0,0,0,[IntPtr]::Zero)
Start-Sleep -Milliseconds 50
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_LEFTUP,0,0,0,[IntPtr]::Zero)
`);
}

export async function mouseRightClick(x: number, y: number): Promise<void> {
  runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::SetCursorPos(${x},${y})
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_RIGHTDOWN,0,0,0,[IntPtr]::Zero)
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_RIGHTUP,0,0,0,[IntPtr]::Zero)
`);
}

export async function mouseScroll(
  direction: string,
  amount: number
): Promise<void> {
  const wheelDelta = 120;
  if (direction === "up" || direction === "down") {
    const delta = direction === "up" ? wheelDelta * amount : -wheelDelta * amount;
    runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_WHEEL,0,0,${delta},[IntPtr]::Zero)
`);
  } else {
    const delta = direction === "right" ? wheelDelta * amount : -wheelDelta * amount;
    runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::mouse_event([MouseOps]::MOUSEEVENTF_HWHEEL,0,0,${delta},[IntPtr]::Zero)
`);
  }
}

export async function mouseMove(x: number, y: number): Promise<void> {
  runPSEncodedVoid(`${MOUSE_CS}
[MouseOps]::SetCursorPos(${x},${y})
`);
}
