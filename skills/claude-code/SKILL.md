# Vox Pilot - Claude Code Skill

Vox Pilot gives Claude Code desktop control tools.

## Default Mode

Desktop control starts in `OFF` mode for every new chat.

When Vox Pilot is `OFF`:

- Do not use desktop control tools.
- Do not take screenshots.
- Do not click, type, scroll, open paths, or switch windows.
- If the user asks for desktop control, first ask them to say `ボックスパイロット開始`.

## Start Command

If the user says one of the following, switch Vox Pilot to `ON` for the current chat:

- `ボックスパイロット開始`
- `Vox Pilot start`
- `desktop control start`

After switching to `ON`, reply briefly that desktop control is now enabled.

## Stop Command

If the user says one of the following, switch Vox Pilot to `OFF` for the current chat:

- `ボックスパイロット終了`
- `Vox Pilot stop`
- `desktop control stop`

After switching to `OFF`, reply briefly that desktop control is now disabled.

## When ON

Use Vox Pilot MCP tools to help the user operate the PC.

### Safe Workflow

1. Use `screenshot` first to understand the current screen.
2. Explain what you are about to do.
3. Use the smallest set of actions needed.
4. Take another screenshot when verification matters.

### Available Tools

Screen tools:

- `screenshot`
- `screenshot_region`
- `list_windows`
- `get_window_info`

Hands tools:

- `mouse_click`
- `mouse_double_click`
- `mouse_right_click`
- `mouse_scroll`
- `mouse_move`
- `type_text`
- `press_key`
- `hotkey`
- `open_path`
- `focus_window`
- `perform_actions`

## Rules

- Respond in the user's language.
- Confirm destructive actions before executing them.
- If a target is small or ambiguous, inspect it first with `screenshot_region`.
- Prefer `perform_actions` for multi-step flows.
