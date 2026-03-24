# Vox Pilot - Session Handoff

Last updated: 2026-03-25

## Project Summary

**Repo**: https://github.com/vox-pilot/vox-pilot
**Concept**: MCP toolkit that gives AI agents eyes and hands to control the user's PC via voice/text.
**Target**: Claude Code + Codex users (Claude Code first)

## Architecture

- Monorepo (pnpm workspace)
- `@vox-pilot/screen` - screenshots, window listing (screen-mcp)
- `@vox-pilot/hands` - mouse, keyboard, file ops, compound actions (hands-mcp)
- `vox-pilot` - one-command setup CLI (setup-cli)
- Skills: `skills/claude-code/SKILL.md` + `skills/codex/skill.md`

## Current Status (2026-03-25)

### Completed
- Initial scaffold: all 3 packages, TypeScript, ESLint, build passing
- P0/P1 fixes from user testing:
  - here-string bug replaced with `-EncodedCommand` + temp file fallback
  - Focus deadlock between tool calls fixed with `perform_actions`
  - Japanese mojibake addressed with `SendInput` + `KEYEVENTF_UNICODE`
- MCP servers registered globally (`claude mcp add --scope user`)
- Automated tests passing for core interactions
- Performance tests stabilized (`tests/perf-3s.test.ts`, 7 tests all PASS):
  - Cold-start gate (6s deadline): bounds first PowerShell/.NET init penalty
  - Warm tests (3s deadline): mouse_click, press_key, list_windows, 3-step actions, 5-step actions, screenshot
  - maxBuffer fix for screenshot base64 output (ENOBUFS)
  - `.gitignore` updated with `tmp_*` pattern

### PR #2 - packaging and docs finish (2026-03-25)
- Added unit tests:
  - `tests/unit/actions.test.ts`
  - `tests/unit/powershell.test.ts`
- Added BOM alignment for `tests/perf-3s.test.ts` temp PowerShell scripts
- Added Japanese README translation at `docs/README.ja.md`
- Added package publish metadata, package-local `LICENSE`, and npm `access=public`
- Added package READMEs for:
  - `packages/hands-mcp/README.md`
  - `packages/screen-mcp/README.md`
  - `packages/setup-cli/README.md`
- Updated `LICENSE` to `Copyright (c) 2026 Vox Pilot Contributors`
- Verified:
  - `pnpm typecheck`
  - `pnpm test` (17/17 PASS)
  - `pnpm build`
  - `pnpm --filter @vox-pilot/hands pack --dry-run`
  - `pnpm --filter @vox-pilot/screen pack --dry-run`
  - `pnpm --filter vox-pilot pack --dry-run`
- Commit: `b8c804b feat: finish pr2 packaging and test coverage`

### Not Yet Verified
- Live MCP re-test after the latest packaging/docs work was not performed

## Next Steps (Priority Order)

1. Optional: re-test `perform_actions` via live MCP after restarting the server.
2. Optional: add `docs/README.zh-CN.md` if Chinese translation is still desired.
3. Optional: record a demo video.
4. Optional: announce or publish the packages.

## Future Optimization (Out of Scope)

- Persistent PowerShell Session: replace `execSync` with `child_process.spawn` for a long-lived PS process.
- `powershell.ts` deduplication: `hands-mcp` and `screen-mcp` have identical copies.

## Key Files

| File | Purpose |
|------|---------|
| `packages/hands-mcp/src/actions.ts` | `perform_actions` compound tool (core feature) |
| `packages/hands-mcp/src/powershell.ts` | PowerShell execution helper (`-EncodedCommand` + temp file) |
| `packages/hands-mcp/src/keyboard.ts` | SendInput Unicode + IME control |
| `packages/hands-mcp/src/explorer.ts` | `focus_window` + `open_path` |
| `packages/screen-mcp/src/screenshot.ts` | PowerShell native screen capture |
| `packages/screen-mcp/src/windows.ts` | Window enumeration via Win32 API |
| `docs/README.ja.md` | Japanese translation of the main README |
| `tests/unit/actions.test.ts` | Script generation unit tests |
| `tests/unit/powershell.test.ts` | PowerShell helper unit tests |

## Known Constraints

- Windows only (Mac untested, but core libs are cross-platform)
- `SendInput` may not work with admin-elevated apps
- Large PowerShell scripts use temp files (command line length limit)
- `perform_actions` is recommended over individual tools for multi-step GUI ops

## Marketing Strategy

- Claude Code first launch, Codex support after that
- English README primary, Japanese translation added
- Submit to awesome-mcp-servers for maximum reach
- Demo video showing voice-controlled PC operation is the key viral asset
