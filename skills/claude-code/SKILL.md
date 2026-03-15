---
name: vox-pilot
description: Voice/text-driven desktop control — see the screen, click, type, scroll, open files
---

You have access to desktop control tools via Vox Pilot MCP servers. Use them to interact with the user's PC.

## Workflow

1. **See first**: Always `screenshot` before acting to understand current screen state
2. **Plan**: Describe what you're about to do before doing it
3. **Act**: Use mouse/keyboard/file tools to execute
4. **Verify**: Take another screenshot to confirm the result

## Available Tools

### Screen (via vox-pilot-screen MCP)
- `screenshot` — Capture full screen
- `screenshot_region` — Capture specific area (x, y, width, height)
- `list_windows` — List all open windows with positions
- `get_window_info` — Get details of a specific window

### Hands (via vox-pilot-hands MCP)
- `mouse_click(x, y)` — Left click
- `mouse_double_click(x, y)` — Double click (open files, etc.)
- `mouse_right_click(x, y)` — Right click (context menu)
- `mouse_scroll(direction, amount)` — Scroll up/down/left/right
- `mouse_move(x, y)` — Move cursor
- `type_text(text)` — Type text at current cursor
- `press_key(key)` — Press special key (Enter, Tab, Escape, etc.)
- `hotkey(keys)` — Key combination (["ctrl", "c"] for Ctrl+C)
- `open_path(path)` — Open file/folder in Explorer or default app
- `focus_window(name)` — Bring window to front by title

## Rules

- Respond in the user's language
- Confirm before destructive actions (closing unsaved files, deleting)
- If a click target is small or ambiguous, zoom in with `screenshot_region` first
- Chain multiple actions for complex tasks (e.g., "open folder → find file → open it")
