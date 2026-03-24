import { describe, expect, it } from "vitest";
import { buildActionPS, buildPerformActionsScript } from "../../packages/hands-mcp/src/actions.js";

describe("buildActionPS", () => {
  it("returns a focused script for click actions", () => {
    const script = buildActionPS({ action: "click", x: 120, y: 240 });
    expect(script).toContain("[MouseOps]::SetCursorPos(120,240)");
    expect(script).toContain("[MouseOps]::mouse_event([MouseOps]::LEFTDOWN,0,0,0,[IntPtr]::Zero)");
    expect(script).toContain('Write-Output "clicked:120,240"');
  });

  it("uses SendInput Unicode for type actions", () => {
    const script = buildActionPS({ action: "type", text: "Hello 日本語" });
    expect(script).toContain("[SendInputOps]::TypeUnicode('Hello 日本語')");
    expect(script).toContain('Write-Output "typed:9 chars"');
  });

  it("renders wait actions", () => {
    const script = buildActionPS({ action: "wait", ms: 750 });
    expect(script).toContain("Start-Sleep -Milliseconds 750");
    expect(script).toContain('Write-Output "waited:750ms"');
  });

  it("renders hotkey combinations", () => {
    const script = buildActionPS({ action: "hotkey", keys: ["ctrl", "shift", "c"] });
    expect(script).toContain("[System.Windows.Forms.SendKeys]::SendWait('^+c')");
    expect(script).toContain('Write-Output "hotkey:ctrl+shift+c"');
  });
});

describe("buildPerformActionsScript", () => {
  it("keeps empty action arrays as a minimal script", () => {
    const script = buildPerformActionsScript([], 200);
    expect(script).toContain("Add-Type -TypeDefinition");
    expect(script).not.toContain("# Action 1:");
  });

  it("preserves action order and inserts delay between actions", () => {
    const script = buildPerformActionsScript(
      [
        { action: "focus", window: "Notepad" },
        { action: "click", x: 10, y: 20 },
        { action: "type", text: "abc" },
        { action: "key", key: "enter" },
      ],
      123
    );

    const focusIndex = script.indexOf("# Action 1: focus");
    const clickIndex = script.indexOf("# Action 2: click");
    const typeIndex = script.indexOf("# Action 3: type");
    const keyIndex = script.indexOf("# Action 4: key");

    expect(focusIndex).toBeGreaterThanOrEqual(0);
    expect(clickIndex).toBeGreaterThan(focusIndex);
    expect(typeIndex).toBeGreaterThan(clickIndex);
    expect(keyIndex).toBeGreaterThan(typeIndex);
    expect(script).toContain("Start-Sleep -Milliseconds 123");
  });
});
