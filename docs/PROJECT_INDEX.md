# Vox Pilot Project Index

Last updated: 2026-03-25

## Project

- Repo: `C:\Users\PC_User\vox-pilot`
- GitHub: `https://github.com/vox-pilot/vox-pilot`
- Purpose: MCP toolkit that gives AI agents eyes and hands to control the user's PC

## Current Branch

- `codex/20260318-fix-perform-actions-encoding`

## Current Release State

- PR #2 work completed locally
- Commit: `b8c804b`
- Tests: `pnpm test` pass
- Build: `pnpm build` pass
- Pack dry-run: pass for all three packages

## Canonical Documents

- [Session Handoff](../HANDOFF.md)
- [Japanese README](README.ja.md)
- [Main README](../README.md)

## Packages

- `packages/hands-mcp`: `@vox-pilot/hands`
- `packages/screen-mcp`: `@vox-pilot/screen`
- `packages/setup-cli`: `vox-pilot`

## Important Files

- `packages/hands-mcp/src/actions.ts`
- `packages/hands-mcp/src/powershell.ts`
- `tests/perf-3s.test.ts`
- `tests/unit/actions.test.ts`
- `tests/unit/powershell.test.ts`

## Verification Commands

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm --filter @vox-pilot/hands pack --dry-run`
- `pnpm --filter @vox-pilot/screen pack --dry-run`
- `pnpm --filter vox-pilot pack --dry-run`

