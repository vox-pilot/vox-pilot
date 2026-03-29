import { beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";

const execSyncMock = vi.hoisted(() => vi.fn());
const writeFileSyncMock = vi.hoisted(() => vi.fn());
const unlinkSyncMock = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", () => ({
  execSync: execSyncMock,
}));

vi.mock("node:fs", () => ({
  writeFileSync: writeFileSyncMock,
  unlinkSync: unlinkSyncMock,
}));

vi.mock("node:crypto", () => ({
  randomUUID: () => "uuid-test",
}));

vi.mock("node:os", () => ({
  tmpdir: () => "C:\\Temp",
}));

import { runPSEncoded, runPSEncodedVoid } from "../../packages/hands-mcp/src/powershell.js";

describe("runPSEncoded", () => {
  beforeEach(() => {
    execSyncMock.mockReset();
    writeFileSyncMock.mockReset();
    unlinkSyncMock.mockReset();
  });

  it("uses EncodedCommand for short scripts", () => {
    execSyncMock.mockReturnValue("ok\n");

    const result = runPSEncoded("Write-Output 'ok'");

    expect(result).toBe("ok");
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock.mock.calls[0][0]).toContain("-EncodedCommand");
    expect(writeFileSyncMock).not.toHaveBeenCalled();
  });

  it("uses a temp ps1 file for long scripts and writes BOM", () => {
    execSyncMock.mockReturnValue("long\n");
    const longScript = "a".repeat(4000);
    const tmpFile = join("C:\\Temp", "vox-pilot-uuid-test.ps1");

    const result = runPSEncoded(longScript);

    expect(result).toBe("long");
    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    expect(writeFileSyncMock.mock.calls[0][0]).toBe(tmpFile);
    expect(writeFileSyncMock.mock.calls[0][1]).toBe("\uFEFF" + longScript);
    expect(writeFileSyncMock.mock.calls[0][2]).toEqual({ encoding: "utf-8" });
    expect(execSyncMock.mock.calls[0][0]).toContain(`-File "${tmpFile}"`);
    expect(unlinkSyncMock).toHaveBeenCalledWith(tmpFile);
  });

  it("cleans up temp file after execution failure", () => {
    execSyncMock.mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => runPSEncoded("a".repeat(4000))).toThrow("boom");
    expect(unlinkSyncMock).toHaveBeenCalledWith(join("C:\\Temp", "vox-pilot-uuid-test.ps1"));
  });
});

describe("runPSEncodedVoid", () => {
  beforeEach(() => {
    execSyncMock.mockReset();
    writeFileSyncMock.mockReset();
    unlinkSyncMock.mockReset();
  });

  it("uses the long-script temp file path and cleans up", () => {
    execSyncMock.mockReturnValue("");
    const tmpFile = join("C:\\Temp", "vox-pilot-uuid-test.ps1");

    runPSEncodedVoid("a".repeat(4000));

    expect(writeFileSyncMock).toHaveBeenCalledWith(
      tmpFile,
      "\uFEFF" + "a".repeat(4000),
      { encoding: "utf-8" }
    );
    expect(execSyncMock.mock.calls[0][0]).toContain(`-File "${tmpFile}"`);
    expect(unlinkSyncMock).toHaveBeenCalledWith(tmpFile);
  });
});
