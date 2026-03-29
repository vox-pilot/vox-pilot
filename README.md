# Vox Pilot

> **⚠️ ARCHIVED** — This project is no longer actively developed. The voice-driven desktop control space now has mature alternatives including Windows Voice Access, DecisionsAI, and Claude Voice + Computer Use API. The MCP tools (screen/hands) remain functional and are used by other skills.

**Your voice flies your desktop.**

Vox Pilot lets AI agents see your screen and control your Windows PC.

## Simple Idea

Think of it like this:

- Your voice input tool turns speech into text.
- Claude Code reads that text.
- Vox Pilot is the part that can look at the screen and use the mouse and keyboard.

## One-Time Setup

Run this once:

```bash
npx vox-pilot
```

That registers the MCP servers for Claude Code or Codex.

For Claude Code, it also installs a simple safety skill:

- Vox Pilot starts in `OFF` mode in each new chat.
- Say `ボックスパイロット開始` to enable desktop control.
- Say `ボックスパイロット終了` to disable desktop control.

So you do **not** need to set everything up again every time you restart Claude Code.

## Manual Setup

### Claude Code

```bash
claude mcp add vox-pilot-screen -- npx @vox-pilot/screen
claude mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

### Codex

```bash
codex mcp add vox-pilot-screen -- npx @vox-pilot/screen
codex mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

## Daily Use With Claude Code

1. Open Claude Code.
2. Say `ボックスパイロット開始`.
3. Give desktop commands like:

```text
Downloads フォルダを開いて
この画面を少し下にスクロールして
Notepad にこんにちはと入力して
```

4. When you want to stop desktop control, say:

```text
ボックスパイロット終了
```

After that, Claude Code should stop using desktop control tools until you start it again.

## Tools

### Screen (`@vox-pilot/screen`)

- `screenshot`
- `screenshot_region`
- `list_windows`
- `get_window_info`

### Hands (`@vox-pilot/hands`)

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

## Requirements

- Node.js 20+
- Windows 10/11
- Claude Code or Codex CLI

## License

[MIT](LICENSE)
