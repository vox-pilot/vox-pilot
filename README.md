# 🛫 Vox Pilot

**Your voice flies your desktop.**

Vox Pilot gives AI coding agents (Claude Code, Codex) eyes and hands to control your PC. See the screen, click, type, scroll, open files — all through natural language.

https://github.com/user-attachments/assets/placeholder-demo-video

## What it does

Talk to your AI agent and it operates your computer:

```
You:    "Open my Documents folder and find the latest spreadsheet"
Agent:  *opens Explorer → navigates → finds file* "Found Q1_Report.xlsx, want me to open it?"

You:    "Scroll down on this page and click the Sign Up button"
Agent:  *takes screenshot → scrolls → identifies button → clicks*

You:    "Switch to Chrome and open a new tab"
Agent:  *focuses Chrome → Ctrl+T*
```

## Quick Start

```bash
npx vox-pilot
```

This auto-detects your AI agent (Claude Code or Codex) and registers the MCP servers.

### Manual Setup

<details>
<summary>Claude Code</summary>

```bash
claude mcp add vox-pilot-screen -- npx @vox-pilot/screen
claude mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

</details>

<details>
<summary>Codex</summary>

```bash
codex mcp add vox-pilot-screen -- npx @vox-pilot/screen
codex mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

</details>

## MCP Tools

### Screen (`@vox-pilot/screen`)

| Tool | Description |
|------|-------------|
| `screenshot` | Capture full screen |
| `screenshot_region` | Capture specific area |
| `list_windows` | List all open windows |
| `get_window_info` | Get window details by name |

### Hands (`@vox-pilot/hands`)

| Tool | Description |
|------|-------------|
| `mouse_click` | Left click at coordinates |
| `mouse_double_click` | Double click |
| `mouse_right_click` | Right click (context menu) |
| `mouse_scroll` | Scroll in any direction |
| `mouse_move` | Move cursor |
| `type_text` | Type text |
| `press_key` | Press special keys (Enter, Tab, etc.) |
| `hotkey` | Key combinations (Ctrl+C, Alt+Tab, etc.) |
| `open_path` | Open file/folder in Explorer |
| `focus_window` | Switch to a window by title |

## Voice Input

Vox Pilot works with any voice-to-text input:

- **Windows Voice Typing** (Win+H) — Built-in, free
- **AquaVoice** — High accuracy voice input
- **Typeless** — AI-powered dictation
- Or any other speech-to-text tool

Just speak naturally — the AI agent understands your intent.

## How It Works

```
Voice Input (any STT) → Text
    ↓
AI Agent (Claude Code / Codex)
    ↓
Vox Pilot MCP Servers
    ├── Screen: captures what's on screen
    └── Hands: clicks, types, scrolls, opens files
```

The AI agent sees your screen via screenshots and controls your PC through native OS APIs. No browser extension needed — it works with any application.

## Requirements

- Node.js 20+
- Windows 10/11 (macOS support coming)
- Claude Code or Codex CLI

## Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

---

[English](README.md) | [日本語](docs/README.ja.md) | [中文](docs/README.zh-CN.md)
