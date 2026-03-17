# Vox Pilot — Session Handoff

Last updated: 2026-03-17

## Project Summary

**Repo**: https://github.com/vox-pilot/vox-pilot
**Concept**: MCP toolkit that gives AI agents eyes and hands to control the user's PC via voice/text.
**Target**: Claude Code + Codex users (Claude Code first)

## Architecture

- Monorepo (pnpm workspace)
- `@vox-pilot/screen` — screenshots, window listing (screen-mcp)
- `@vox-pilot/hands` — mouse, keyboard, file ops, compound actions (hands-mcp)
- `vox-pilot` — one-command setup CLI (setup-cli)
- Skills: `skills/claude-code/SKILL.md` + `skills/codex/skill.md`

## Current Status (2026-03-17)

### Completed
- Initial scaffold: all 3 packages, TypeScript, ESLint, build passing
- P0/P1 fixes from user testing:
  - here-string bug → replaced with `-EncodedCommand` + temp file fallback
  - Focus deadlock between tool calls → `perform_actions` compound tool
  - Japanese mojibake → `SendInput` + `KEYEVENTF_UNICODE` (replaces SendKeys)
- MCP servers registered globally (`claude mcp add --scope user`)
- Automated tests passing (focus_window, perform_actions)

### Not Yet Tested via MCP
- screenshot through MCP (tested directly, not via MCP server)
- list_windows through MCP
- perform_actions through MCP (tested via Node.js script, not MCP)
- Japanese input through MCP

## Next Steps (Priority Order)

1. **Human test via MCP** — start new Claude Code session, test:
   - `screenshot` / `list_windows` / `perform_actions` / Japanese `type_text`
2. **Fix issues from MCP testing** (if any)
3. **README translations** — Japanese (`docs/README.ja.md`) + Chinese (`docs/README.zh-CN.md`)
4. **Demo video** — scenario script + recording
5. **npm publish** — `@vox-pilot/screen`, `@vox-pilot/hands`, `vox-pilot`
6. **awesome-mcp-servers PR** — main distribution channel (81k stars)

## Key Files

| File | Purpose |
|------|---------|
| `packages/hands-mcp/src/actions.ts` | `perform_actions` compound tool (core feature) |
| `packages/hands-mcp/src/powershell.ts` | PowerShell execution helper (-EncodedCommand + temp file) |
| `packages/hands-mcp/src/keyboard.ts` | SendInput Unicode + IME control |
| `packages/hands-mcp/src/explorer.ts` | focus_window + open_path |
| `packages/screen-mcp/src/screenshot.ts` | PowerShell native screen capture |
| `packages/screen-mcp/src/windows.ts` | Window enumeration via Win32 API |

## Known Constraints

- Windows only (Mac untested, but core libs are cross-platform)
- `SendInput` may not work with admin-elevated apps
- Large PowerShell scripts use temp files (command line length limit)
- `perform_actions` is recommended over individual tools for multi-step GUI ops

## Marketing Strategy

- Claude Code first launch → Codex support announced 2 weeks later
- English README primary, Japanese + Chinese translations
- Submit to awesome-mcp-servers for maximum reach
- Demo video showing voice-controlled PC operation is the key viral asset
