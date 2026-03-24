> This is a Japanese translation of README.md
> English version: [../README.md](../README.md)

# Vox Pilot

**Your voice flies your desktop.**

Vox Pilot は、AI coding agents（Claude Code, Codex）に PC を操作するための目と手を与える MCP ツールキットです。画面の確認、クリック、入力、スクロール、ファイル操作を自然言語から実行できます。

## できること

AI agent に話しかけると、PC を操作します。

```text
You:    "Open my Documents folder and find the latest spreadsheet"
Agent:  *opens Explorer -> navigates -> finds file* "Found Q1_Report.xlsx, want me to open it?"

You:    "Scroll down on this page and click the Sign Up button"
Agent:  *takes screenshot -> scrolls -> identifies button -> clicks*

You:    "Switch to Chrome and open a new tab"
Agent:  *focuses Chrome -> Ctrl+T*
```

## Quick Start

```bash
npx vox-pilot
```

このコマンドは、使用中の AI agent（Claude Code または Codex）を自動検出し、MCP servers を登録します。

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
| `screenshot` | 画面全体をキャプチャ |
| `screenshot_region` | 指定範囲をキャプチャ |
| `list_windows` | 開いているウィンドウを列挙 |
| `get_window_info` | ウィンドウ名から詳細を取得 |

### Hands (`@vox-pilot/hands`)

| Tool | Description |
|------|-------------|
| `mouse_click` | 指定座標を左クリック |
| `mouse_double_click` | ダブルクリック |
| `mouse_right_click` | 右クリック（コンテキストメニュー） |
| `mouse_scroll` | 任意方向にスクロール |
| `mouse_move` | カーソルを移動 |
| `type_text` | テキストを入力 |
| `press_key` | 特殊キーを押す |
| `hotkey` | キーの組み合わせを送る |
| `open_path` | Explorer でファイル / フォルダを開く |
| `focus_window` | ウィンドウをタイトルで切り替える |

## Voice Input

Vox Pilot は任意の voice-to-text input と組み合わせて使えます。

- **Windows Voice Typing**（Win+H）- 標準搭載、無料
- **AquaVoice** - 高精度な音声入力
- **Typeless** - AI ベースの dictation
- その他の speech-to-text ツールでも可

自然に話すだけで、AI agent が意図を理解します。

## How It Works

```text
Voice Input (any STT) -> Text
    ->
AI Agent (Claude Code / Codex)
    ->
Vox Pilot MCP Servers
    -> Screen: captures what's on screen
    -> Hands: clicks, types, scrolls, opens files
```

AI agent は screenshot で画面を見て、native OS APIs を通じて PC を操作します。browser extension は不要で、任意のアプリケーションで使えます。

## Requirements

- Node.js 20+
- Windows 10/11（macOS support coming）
- Claude Code または Codex CLI

## Contributing

See the original [Contributing section](../README.md#contributing).

## License

See the original [License section](../README.md#license).
